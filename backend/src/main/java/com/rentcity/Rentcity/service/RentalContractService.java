package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.*;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RentalContractService {

    public static final String POLICY_VERSION = "1.0";
    public static final String POLICY_TEXT = """
            Only approved drivers may drive the vehicle. The vehicle must not be used for illegal activity, racing, drunk driving, off-road driving, or sub-rental.

            The customer must report accidents, damage, theft, breakdown, or warning lights to RentCity immediately and must not arrange unauthorized repairs.

            The customer is responsible for traffic fines, tolls, parking fees, lost keys or accessories, cleaning caused by abnormal use, and damage occurring during the rental.

            The 30% reservation fee secures the vehicle and is applied to the rental price. The remaining rental amount, plus any overdue charge, is settled when the vehicle is returned.

            The vehicle security deposit is refundable when the vehicle is returned in GOOD condition without a problem. It is retained for repair or maintenance when the return condition is DAMAGE or maintenance required. The collection and resolution methods are recorded in this contract.

            By signing, the customer and staff confirm that the booking details, vehicle condition, photographs, included items, and charges displayed in this record are correct.
            """;

    private static final DateTimeFormatter NUMBER_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final RentalContractRepository contractRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final CarConditionService carConditionService;
    private final FileStorageService fileStorageService;
    private final BookingStateMachineService bookingStateMachineService;
    private final NotificationService notificationService;
    private final OverdueFeeService overdueFeeService;
    private final WalletService walletService;
    private final DamageAssessmentService damageAssessmentService;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public RentalContractResponse getForActor(String email, Long bookingId) {
        User actor = requireUser(email);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        assertCanView(actor, booking);
        RentalContract contract = contractRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("rental contract", bookingId));
        return map(contract);
    }

    @Transactional
    public RentalContractResponse completeHandover(
            String actorEmail,
            Long bookingId,
            HandoverContractRequest request,
            List<MultipartFile> photos,
            MultipartFile customerSignature,
            MultipartFile staffSignature
    ) {
        User actor = requireStaff(actorEmail);
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (booking.getStatus() != BookingStatus.PAID) {
            throw new IllegalArgumentException("Vehicle handover requires a paid vehicle security deposit");
        }
        if (booking.getDepositStatus() != DepositStatus.PAID
                && booking.getDepositStatus() != DepositStatus.NOT_REQUIRED) {
            throw new IllegalArgumentException("The required booking deposit must be paid before handover");
        }
        if (booking.getSecurityDepositStatus() != SecurityDepositStatus.PAID) {
            throw new IllegalArgumentException("The vehicle security deposit must be paid before handover");
        }
        if (contractRepository.findByBookingId(bookingId).isPresent()) {
            throw new IllegalArgumentException("A rental contract already exists for this booking");
        }
        requirePhotosAndSignatures(photos, customerSignature, staffSignature);
        validateHandoverCondition(request.getCondition(), request.isDamageFound());
        if (request.getActualHandoverAt().isBefore(booking.getCreatedAt())) {
            throw new IllegalArgumentException("Handover time cannot be before the booking was created");
        }
        if (request.getActualHandoverAt().isAfter(booking.getEndTime())) {
            throw new IllegalArgumentException("Handover time cannot be after the scheduled return time");
        }

        Car car = carRepository.findByIdForUpdate(booking.getCarId())
                .orElseThrow(() -> new ResourceNotFoundException("car", booking.getCarId()));
        if (car.getStatus() != CarStatus.AVAILABLE) {
            throw new IllegalArgumentException("Vehicle is not available for handover");
        }

        CarConditionRequest conditionRequest = CarConditionRequest.builder()
                .condition(request.getCondition())
                .damageFound(request.isDamageFound())
                .notes(request.getNotes())
                .build();
        CarConditionReport report = carConditionService.createHandover(
                car.getId(), bookingId, conditionRequest, actor.getId(), actor.getRole(), photos
        );

        LocalDateTime now = LocalDateTime.now();
        RentalContract contract = RentalContract.builder()
                .bookingId(bookingId)
                .contractNumber(generateContractNumber())
                .policyVersion(POLICY_VERSION)
                .policyText(POLICY_TEXT)
                .handoverConditionReportId(report.getId())
                .handoverAt(request.getActualHandoverAt())
                .handoverKeyCount(request.getKeyCount())
                .handoverAccessories(normalize(request.getAccessories()))
                .handoverCustomerSignature(fileStorageService.storePrivate(customerSignature, "contracts/signatures"))
                .handoverCustomerSignedAt(now)
                .handoverStaffSignature(fileStorageService.storePrivate(staffSignature, "contracts/signatures"))
                .handoverStaffUserId(actor.getId())
                .handoverStaffSignedAt(now)
                .securityDepositAmount(booking.getSecurityDepositAmount())
                .securityDepositCollectionMethod(booking.getSecurityDepositCollectionMethod())
                .securityDepositGateway(booking.getSecurityDepositGateway())
                .securityDepositPaidAt(booking.getSecurityDepositPaidAt())
                .status(RentalContractStatus.ACTIVE)
                .build();

        bookingStateMachineService.transition(
                booking,
                BookingStatus.ONGOING,
                actor.getId(),
                actor.getRole(),
                "SIGNED_HANDOVER",
                "Vehicle handed over under contract " + contract.getContractNumber()
        );
        bookingRepository.save(booking);
        RentalContract saved = contractRepository.save(contract);
        notificationService.notifyBookingStatusChanged(booking, BookingStatus.ONGOING);
        return map(saved);
    }

    @Transactional
    public RentalContractResponse completeReturn(
            String actorEmail,
            Long bookingId,
            ReturnContractRequest request,
            List<MultipartFile> photos,
            MultipartFile customerSignature,
            MultipartFile staffSignature
    ) {
        User actor = requireStaff(actorEmail);
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        if (booking.getStatus() != BookingStatus.ONGOING) {
            throw new IllegalArgumentException("Vehicle return requires an ONGOING booking");
        }

        RentalContract contract = contractRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Complete the signed handover before returning the vehicle"));
        if (contract.getStatus() != RentalContractStatus.ACTIVE) {
            throw new IllegalArgumentException("This rental contract is not active");
        }
        requirePhotosAndSignatures(photos, customerSignature, staffSignature);
        validateReturnCondition(request);
        validateDamage(request);
        if (request.getActualReturnAt().isBefore(contract.getHandoverAt())) {
            throw new IllegalArgumentException("Actual return time cannot be before the actual handover time");
        }

        CarConditionResponse handover = carConditionService.getById(contract.getHandoverConditionReportId());
        if (handover == null) {
            throw new IllegalStateException("Handover condition is missing");
        }

        Car car = carRepository.findByIdForUpdate(booking.getCarId())
                .orElseThrow(() -> new ResourceNotFoundException("car", booking.getCarId()));
        CarConditionRequest conditionRequest = toConditionRequest(request, handover);
        CarConditionReport returnReport = carConditionService.createReturn(
                car.getId(), bookingId, conditionRequest, actor.getId(), actor.getRole(), photos
        );

        BigDecimal bookedSubtotal = bookedSubtotal(booking);
        OverdueFeeService.OverdueCharge overdueCharge = overdueFeeService.calculate(
                booking.getStartTime(),
                contract.getHandoverAt(),
                booking.getEndTime(),
                request.getActualReturnAt(),
                car.getPricePerDay()
        );
        booking.setActualReturnAt(request.getActualReturnAt());
        booking.setOverdueMinutes(overdueCharge.overdueMinutes());
        booking.setOverdueFee(overdueCharge.fee());
        booking.setPenaltyOverdueFee(overdueCharge.penaltyFee());
        booking.setTotalOverdueFee(overdueCharge.totalFee());
        booking.setTotalAmount(bookedSubtotal.add(overdueCharge.totalFee()));
        booking.setDamageFee(BigDecimal.ZERO);

        BigDecimal finalRentalAmount = bookedSubtotal
                .subtract(booking.getDepositAmount())
                .max(BigDecimal.ZERO)
                .add(overdueCharge.totalFee());
        booking.setFinalRentalAmount(finalRentalAmount);
        booking.setFinalPaymentMethod(request.getFinalPaymentMethod());
        settleFinalRentalPayment(booking, finalRentalAmount, request.getFinalPaymentMethod(), actor.getId());
        resolveSecurityDeposit(booking, request, actor.getId());

        car.setStatus(request.getCondition() == CarCondition.GOOD
                ? CarStatus.AVAILABLE
                : CarStatus.MAINTENANCE);
        carRepository.save(car);

        LocalDateTime now = LocalDateTime.now();
        contract.setStatus(RentalContractStatus.COMPLETED);
        contract.setReturnConditionReportId(returnReport.getId());
        contract.setReturnKeyCount(request.getKeyCount());
        contract.setReturnAccessories(normalize(request.getAccessories()));
        contract.setReturnCustomerSignature(fileStorageService.storePrivate(customerSignature, "contracts/signatures"));
        contract.setReturnCustomerSignedAt(now);
        contract.setReturnStaffSignature(fileStorageService.storePrivate(staffSignature, "contracts/signatures"));
        contract.setReturnStaffUserId(actor.getId());
        contract.setReturnStaffSignedAt(now);
        contract.setSecurityDepositStatus(booking.getSecurityDepositStatus());
        contract.setSecurityDepositRefundMethod(booking.getSecurityDepositRefundMethod());
        contract.setSecurityDepositResolvedAt(booking.getSecurityDepositResolvedAt());
        contract.setSecurityDepositRepairCost(booking.getSecurityDepositRepairCost());
        contract.setSecurityDepositRefundedAmount(booking.getSecurityDepositRefundedAmount());
        contract.setFinalRentalAmount(booking.getFinalRentalAmount());
        contract.setFinalPaymentMethod(booking.getFinalPaymentMethod());
        contract.setFinalPaymentStatus(booking.getFinalPaymentStatus());

        bookingStateMachineService.transition(
                booking,
                BookingStatus.COMPLETED,
                actor.getId(),
                actor.getRole(),
                "SIGNED_RETURN",
                request.getNotes()
        );
        bookingRepository.save(booking);
        RentalContract saved = contractRepository.save(contract);
        notificationService.notifyBookingStatusChanged(booking, BookingStatus.COMPLETED);
        return map(saved);
    }

    @Transactional
    public RentalContractResponse resolveRetainedSecurityDeposit(
            String actorEmail,
            Long bookingId,
            ResolveRetainedSecurityDepositRequest request
    ) {
        User actor = requireAdmin(actorEmail);
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        RentalContract contract = contractRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("rental contract", bookingId));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Retained security deposit can only be resolved after return completion");
        }
        if (booking.getSecurityDepositStatus() != SecurityDepositStatus.RETAINED) {
            throw new IllegalArgumentException("This booking does not have a retained security deposit");
        }
        if (booking.getSecurityDepositRepairCost() != null) {
            throw new IllegalArgumentException("The retained security deposit has already been resolved");
        }

        BigDecimal depositAmount = nonNull(booking.getSecurityDepositAmount());
        BigDecimal repairCost = request.getActualRepairCost();
        BigDecimal refundAmount = depositAmount.subtract(repairCost).max(BigDecimal.ZERO);
        if (refundAmount.signum() > 0 && request.getRefundMethod() == null) {
            throw new IllegalArgumentException("Choose a refund method for the remaining security deposit");
        }

        LocalDateTime now = LocalDateTime.now();
        booking.setSecurityDepositRepairCost(repairCost);
        booking.setSecurityDepositRefundedAmount(refundAmount);
        booking.setSecurityDepositRefundMethod(refundAmount.signum() > 0 ? request.getRefundMethod() : null);
        booking.setSecurityDepositResolvedAt(now);
        booking.setSecurityDepositStatus(refundAmount.signum() > 0
                ? SecurityDepositStatus.REFUNDED
                : SecurityDepositStatus.RETAINED);

        if (refundAmount.signum() > 0) {
            PaymentGateway gateway = securityDepositRefundGateway(booking, request.getRefundMethod());
            if (request.getRefundMethod() == SettlementMethod.CASH) {
                if (isWalletSecurityDeposit(booking)) {
                    walletService.recordRetainedSecurityDepositCashRefund(
                            booking.getUserId(), bookingId, refundAmount,
                            "booking:" + bookingId + ":retained-deposit-cash-refund", actor.getId()
                    );
                }
            } else {
                walletService.refundRetainedSecurityDepositToWallet(
                        booking.getUserId(), bookingId, refundAmount,
                        "booking:" + bookingId + ":retained-deposit-wallet-refund", actor.getId()
                );
            }
            Payment refundPayment = recordPayment(
                    booking, PaymentType.SECURITY_DEPOSIT_REFUND, gateway,
                    PaymentStatus.REFUNDED, refundAmount, actor.getId()
            );
            notificationService.notifyPaymentStatusChanged(refundPayment, PaymentStatus.REFUNDED);
        }

        contract.setSecurityDepositStatus(booking.getSecurityDepositStatus());
        contract.setSecurityDepositRefundMethod(booking.getSecurityDepositRefundMethod());
        contract.setSecurityDepositResolvedAt(now);
        contract.setSecurityDepositRepairCost(repairCost);
        contract.setSecurityDepositRefundedAmount(refundAmount);

        bookingRepository.save(booking);
        return map(contractRepository.save(contract));
    }

    @Transactional(readOnly = true)
    public RentalContract findAuthorizedContract(String email, Long bookingId) {
        User actor = requireUser(email);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        assertCanView(actor, booking);
        return contractRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("rental contract", bookingId));
    }

    public RentalContractResponse map(RentalContract contract) {
        return RentalContractResponse.builder()
                .id(contract.getId())
                .bookingId(contract.getBookingId())
                .contractNumber(contract.getContractNumber())
                .policyVersion(contract.getPolicyVersion())
                .policyText(displayText(contract.getPolicyText()))
                .status(contract.getStatus())
                .handoverAt(contract.getHandoverAt())
                .handoverKeyCount(contract.getHandoverKeyCount())
                .handoverAccessories(contract.getHandoverAccessories())
                .handoverCustomerSignature(contract.getHandoverCustomerSignature() != null ? "SIGNED" : null)
                .handoverCustomerSignedAt(contract.getHandoverCustomerSignedAt())
                .handoverStaffSignature(contract.getHandoverStaffSignature() != null ? "SIGNED" : null)
                .handoverStaffUserId(contract.getHandoverStaffUserId())
                .handoverStaffSignedAt(contract.getHandoverStaffSignedAt())
                .securityDepositAmount(contract.getSecurityDepositAmount())
                .securityDepositCollectionMethod(contract.getSecurityDepositCollectionMethod())
                .securityDepositGateway(contract.getSecurityDepositGateway())
                .securityDepositPaidAt(contract.getSecurityDepositPaidAt())
                .handoverCondition(carConditionService.getById(contract.getHandoverConditionReportId()))
                .returnKeyCount(contract.getReturnKeyCount())
                .returnAccessories(contract.getReturnAccessories())
                .returnCustomerSignature(contract.getReturnCustomerSignature() != null ? "SIGNED" : null)
                .returnCustomerSignedAt(contract.getReturnCustomerSignedAt())
                .returnStaffSignature(contract.getReturnStaffSignature() != null ? "SIGNED" : null)
                .returnStaffUserId(contract.getReturnStaffUserId())
                .returnStaffSignedAt(contract.getReturnStaffSignedAt())
                .returnCondition(carConditionService.getById(contract.getReturnConditionReportId()))
                .securityDepositStatus(contract.getSecurityDepositStatus())
                .securityDepositRefundMethod(contract.getSecurityDepositRefundMethod())
                .securityDepositResolvedAt(contract.getSecurityDepositResolvedAt())
                .securityDepositRepairCost(contract.getSecurityDepositRepairCost())
                .securityDepositRefundedAmount(nonNull(contract.getSecurityDepositRefundedAmount()))
                .finalRentalAmount(contract.getFinalRentalAmount())
                .finalPaymentMethod(contract.getFinalPaymentMethod())
                .finalPaymentStatus(contract.getFinalPaymentStatus())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private User requireStaff(String email) {
        User actor = requireUser(email);
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Only admin or staff can complete rental contracts");
        }
        return actor;
    }

    private User requireAdmin(String email) {
        User actor = requireUser(email);
        if (actor.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only admin can resolve a retained security deposit");
        }
        return actor;
    }

    private void assertCanView(User actor, Booking booking) {
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF
                && !booking.getUserId().equals(actor.getId())) {
            throw new ResourceNotFoundException("rental contract", booking.getId());
        }
    }

    private void requirePhotosAndSignatures(
            List<MultipartFile> photos,
            MultipartFile customerSignature,
            MultipartFile staffSignature
    ) {
        if (photos == null || photos.stream().noneMatch(file -> file != null && !file.isEmpty())) {
            throw new IllegalArgumentException("At least one vehicle photo is required");
        }
        if (customerSignature == null || customerSignature.isEmpty()) {
            throw new IllegalArgumentException("Customer signature is required");
        }
        if (staffSignature == null || staffSignature.isEmpty()) {
            throw new IllegalArgumentException("Staff signature is required");
        }
    }

    private void validateHandoverCondition(CarCondition condition, boolean damageFound) {
        if (condition == CarCondition.NEED_MAINTENANCE) {
            throw new IllegalArgumentException("A vehicle needing maintenance cannot be handed over");
        }
        if (damageFound && condition == CarCondition.GOOD) {
            throw new IllegalArgumentException("A vehicle with damage cannot have GOOD condition");
        }
        if (condition == CarCondition.DAMAGE && !damageFound) {
            throw new IllegalArgumentException("DAMAGE condition must mark damage as found");
        }
    }

    private void validateDamage(ReturnContractRequest request) {
        if (request.getCondition() == CarCondition.GOOD) {
            return;
        }
        if (request.getCondition() == CarCondition.DAMAGE
                && (request.getDamageSeverity() == null
                || request.getDamageDescription() == null
                || request.getDamageDescription().isBlank())) {
            throw new IllegalArgumentException("Damage severity and description are required");
        }
    }

    private void validateReturnCondition(ReturnContractRequest request) {
        if (request.getCondition() == CarCondition.GOOD && request.isDamageFound()) {
            throw new IllegalArgumentException("A vehicle with damage cannot have GOOD condition");
        }
        if (request.getCondition() == CarCondition.DAMAGE && !request.isDamageFound()) {
            throw new IllegalArgumentException("DAMAGE condition must mark damage as found");
        }
        if (request.getCondition() == CarCondition.GOOD && request.getSecurityDepositRefundMethod() == null) {
            throw new IllegalArgumentException("Choose how the security deposit will be refunded");
        }
        if (request.getCondition() != CarCondition.GOOD && request.getSecurityDepositRefundMethod() != null) {
            throw new IllegalArgumentException("A retained security deposit cannot also have a refund method");
        }
    }

    private void settleFinalRentalPayment(
            Booking booking,
            BigDecimal amount,
            SettlementMethod method,
            Long actorId
    ) {
        if (method == SettlementMethod.CASH) {
            booking.setFinalPaymentStatus(FinalPaymentStatus.PAID);
            booking.setFinalPaidAt(LocalDateTime.now());
            booking.setOutstandingAmount(BigDecimal.ZERO);
            recordPayment(booking, PaymentType.FINAL_RENTAL_PAYMENT, PaymentGateway.CASH,
                    PaymentStatus.PAID, amount, actorId);
        } else {
            booking.setFinalPaymentStatus(FinalPaymentStatus.PAYMENT_REQUESTED);
            booking.setOutstandingAmount(amount);
        }
    }

    private BigDecimal bookedSubtotal(Booking booking) {
        return nonNull(booking.getBaseAmount())
                .add(nonNull(booking.getExtraServicesAmount()))
                .add(nonNull(booking.getDeliveryFeeAmount()));
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void resolveSecurityDeposit(Booking booking, ReturnContractRequest request, Long actorId) {
        LocalDateTime now = LocalDateTime.now();
        if (request.getCondition() != CarCondition.GOOD) {
            booking.setSecurityDepositStatus(SecurityDepositStatus.RETAINED);
            booking.setSecurityDepositRefundMethod(null);
            booking.setSecurityDepositResolvedAt(now);
            if (isWalletSecurityDeposit(booking)) {
                walletService.retainSecurityDeposit(
                        booking.getUserId(), booking.getId(),
                        "booking:" + booking.getId() + ":security-deposit-retained", actorId
                );
            }
            return;
        }

        booking.setSecurityDepositStatus(SecurityDepositStatus.REFUNDED);
        booking.setSecurityDepositRefundMethod(request.getSecurityDepositRefundMethod());
        booking.setSecurityDepositResolvedAt(now);
        booking.setSecurityDepositRefundedAmount(booking.getSecurityDepositAmount());
        if (request.getSecurityDepositRefundMethod() == SettlementMethod.CASH) {
            if (isWalletSecurityDeposit(booking)) {
                walletService.refundSecurityDepositByCash(
                        booking.getUserId(), booking.getId(),
                        "booking:" + booking.getId() + ":security-deposit-cash-refund", actorId
                );
            }
            recordPayment(booking, PaymentType.SECURITY_DEPOSIT_REFUND, PaymentGateway.CASH,
                    PaymentStatus.REFUNDED, booking.getSecurityDepositAmount(), actorId);
        } else {
            walletService.refundBookingDeposit(
                    booking.getUserId(), booking.getId(), booking.getSecurityDepositAmount(),
                    "booking:" + booking.getId() + ":security-deposit-refund",
                    "Vehicle security deposit added to refundable balance"
            );
            recordPayment(booking, PaymentType.SECURITY_DEPOSIT_REFUND, securityDepositRefundGateway(booking, request.getSecurityDepositRefundMethod()),
                    PaymentStatus.REFUNDED, booking.getSecurityDepositAmount(), actorId);
        }
    }

    private boolean isWalletSecurityDeposit(Booking booking) {
        return booking.getSecurityDepositGateway() == PaymentGateway.WALLET;
    }

    private PaymentGateway securityDepositRefundGateway(Booking booking, SettlementMethod refundMethod) {
        if (refundMethod == SettlementMethod.CASH) {
            return PaymentGateway.CASH;
        }
        return PaymentGateway.WALLET;
    }

    private Payment recordPayment(
            Booking booking,
            PaymentType type,
            PaymentGateway gateway,
            PaymentStatus status,
            BigDecimal amount,
            Long actorId
    ) {
        LocalDateTime now = LocalDateTime.now();
        return paymentRepository.save(Payment.builder()
                .bookingId(booking.getId())
                .userId(booking.getUserId())
                .type(type)
                .gateway(gateway)
                .status(status)
                .amount(amount)
                .currency("VND")
                .gatewayReference(gateway + "-" + UUID.randomUUID())
                .gatewayTransactionId("STAFF-" + actorId)
                .idempotencyKey(type + "-" + booking.getId() + "-" + UUID.randomUUID())
                .paidAt(status == PaymentStatus.PAID ? now : null)
                .refundedAt(status == PaymentStatus.REFUNDED ? now : null)
                .build());
    }

    private CarConditionRequest toConditionRequest(ReturnContractRequest request, CarConditionResponse handover) {
        return CarConditionRequest.builder()
                .condition(request.getCondition())
                .actualReturnAt(request.getActualReturnAt())
                .damageFound(request.isDamageFound())
                .damageSeverity(request.getDamageSeverity())
                .estimatedDamageFee(request.getEstimatedDamageFee())
                .damageDescription(request.getDamageDescription())
                .notes(request.getNotes())
                .build();
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String displayText(String value) {
        if (value == null) {
            return null;
        }
        return value.replace("NEED_MAINTENANCE", "maintenance required");
    }

    private String generateContractNumber() {
        String suffix = UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase(Locale.ROOT);
        return "RC-CON-" + LocalDateTime.now().format(NUMBER_DATE) + "-" + suffix;
    }
}
