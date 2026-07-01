package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.BookingQuote;
import com.rentcity.Rentcity.dto.BookingResponse;
import com.rentcity.Rentcity.dto.CreateBookingRequest;
import com.rentcity.Rentcity.dto.AdminBookingTransitionRequest;
import com.rentcity.Rentcity.dto.CarConditionRequest;
import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.dto.SecurityDepositCollectionRequest;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.PaymentRepository;
import com.rentcity.Rentcity.repository.RentalContractRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final DateTimeFormatter BOOKING_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final BookingAvailabilityService bookingAvailabilityService;
    private final BookingPricingService bookingPricingService;
    private final BookingStateMachineService bookingStateMachineService;
    private final BookingCancellationPolicyService bookingCancellationPolicyService;
    private final NotificationService notificationService;
    private final BookingExpirationService bookingExpirationService;
    private final CarConditionService carConditionService;
    private final OverdueFeeService overdueFeeService;
    private final WalletService walletService;
    private final DamageAssessmentService damageAssessmentService;
    private final RentalContractRepository rentalContractRepository;

    @Transactional
    public BookingResponse createBooking(String email, CreateBookingRequest request) {
        validateRequest(request);
        LocalDateTime bookingCreatedAt = LocalDateTime.now();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Car car = carRepository.findByIdForUpdate(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("xe", request.getVehicleId()));

        if (car.getStatus() != CarStatus.AVAILABLE) {
            throw new IllegalArgumentException("Xe hiện không sẵn sàng để đặt");
        }

        bookingAvailabilityService.ensureNoOverlap(car.getId(), request.getStartTime(), request.getEndTime());

        boolean insuranceSelected = Boolean.TRUE.equals(request.getInsuranceSelected());
        int childSeatQuantity = normalizeChildSeatQuantity(request.getChildSeatQuantity());
        boolean gpsSelected = Boolean.TRUE.equals(request.getGpsSelected());

        BookingQuote quote = bookingPricingService.calculateQuote(
                car,
                request.getStartTime(),
                request.getEndTime(),
                request.getPricingMode(),
                request.getPickupMethod(),
                insuranceSelected,
                childSeatQuantity,
                gpsSelected
        );

        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .userId(user.getId())
                .carId(car.getId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .pickupMethod(request.getPickupMethod())
                .deliveryAddress(normalizeDeliveryAddress(request))
                .pricingMode(request.getPricingMode())
                .status(BookingStatus.PENDING)
                .depositStatus(DepositStatus.UNPAID)
                .baseAmount(quote.getBaseAmount())
                .insuranceSelected(insuranceSelected)
                .childSeatQuantity(childSeatQuantity)
                .gpsSelected(gpsSelected)
                .extraServicesAmount(quote.getExtraServicesAmount())
                .deliveryFeeAmount(quote.getDeliveryFeeAmount())
                .depositAmount(quote.getDepositAmount())
                .securityDepositAmount(car.getDeposit())
                .securityDepositStatus(SecurityDepositStatus.UNPAID)
                .securityDepositPaidAmount(BigDecimal.ZERO)
                .totalAmount(quote.getTotalAmount())
                .freeCancelUntil(bookingCancellationPolicyService.calculateFreeCancelUntil(
                        request.getStartTime(),
                        request.getPricingMode(),
                        bookingCreatedAt
                ))
                .paymentExpiresAt(bookingExpirationService.newPaymentDeadline())
                .initialConditionReportId(resolveCurrentConditionId(car.getId()))
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        bookingStateMachineService.recordInitialStatus(
                savedBooking,
                user.getId(),
                user.getRole(),
                "BOOKING_CREATED",
                "Booking được tạo ở trạng thái chờ xác nhận"
        );

        notificationService.notifyBookingCreated(savedBooking, user, car);
        return mapToResponse(savedBooking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return mapToResponses(bookings);
    }

    @Transactional(readOnly = true)
    public BookingResponse getMyBooking(String email, Long bookingId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (!booking.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("booking", bookingId);
        }

        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAdminBookings(
            BookingStatus status,
            Long vehicleId,
            Long userId,
            LocalDateTime fromTime,
            LocalDateTime toTime
    ) {
        List<Booking> bookings = bookingRepository.findAll(buildAdminBookingSpecification(
                status,
                vehicleId,
                userId,
                fromTime,
                toTime
        ), Sort.by(Sort.Direction.DESC, "createdAt"));
        return mapToResponses(bookings);
    }

    @Transactional(readOnly = true)
    public BookingResponse getAdminBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(String email, Long bookingId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (!booking.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("booking", bookingId);
        }

        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.CONFIRMED
                && booking.getStatus() != BookingStatus.PAID) {
            throw new IllegalArgumentException("Chỉ có thể hủy booking ở trạng thái PENDING, CONFIRMED hoặc PAID");
        }

        var cancelledAt = LocalDateTime.now();
        DepositStatus depositStatus = bookingCancellationPolicyService
                .determineDepositStatusAfterCustomerCancel(booking, cancelledAt);

        bookingStateMachineService.transition(
                booking,
                BookingStatus.CANCELLED,
                user.getId(),
                user.getRole(),
                "CUSTOMER_CANCELLED",
                buildCancelNote(depositStatus, cancelledAt, booking.getFreeCancelUntil())
        );

        booking.setDepositStatus(depositStatus);
        booking.setCancelledAt(cancelledAt);
        booking.setCancelReason("CUSTOMER_CANCELLED");
        booking.setCancelledBy(user.getEmail());

        if (depositStatus == DepositStatus.REFUNDED) {
            markDepositPaymentRefunded(booking.getId(), cancelledAt);
            walletService.refundBookingDeposit(
                    booking.getUserId(),
                    booking.getId(),
                    booking.getDepositAmount(),
                    "booking:" + booking.getId() + ":cancel-release",
                    "Deposit returned to wallet after free cancellation"
            );
        } else if (depositStatus == DepositStatus.FORFEITED) {
            walletService.forfeitBookingHold(
                    booking.getUserId(),
                    booking.getId(),
                    "booking:" + booking.getId() + ":cancel-forfeit"
            );
        }

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingStatusChanged(savedBooking, BookingStatus.CANCELLED);
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse transitionBookingAsAdmin(
            String actorEmail,
            Long bookingId,
            AdminBookingTransitionRequest request
    ) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Chỉ admin hoặc staff mới được chuyển trạng thái booking");
        }

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (request.getTargetStatus() == BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Complete the booking by submitting a return condition");
        }
        if (request.getTargetStatus() == BookingStatus.ONGOING) {
            throw new IllegalArgumentException("Start the rental by completing the signed vehicle handover");
        }

        bookingStateMachineService.transition(
                booking,
                request.getTargetStatus(),
                actor.getId(),
                actor.getRole(),
                normalizeReason(request.getReason(), request.getTargetStatus()),
                request.getNote()
        );

        if (request.getTargetStatus() == BookingStatus.CONFIRMED && booking.getDepositStatus() == DepositStatus.UNPAID) {
            booking.setDepositStatus(DepositStatus.PAID);
        }

        if (request.getTargetStatus() == BookingStatus.CANCELLED) {
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancelReason(normalizeReason(request.getReason(), request.getTargetStatus()));
            booking.setCancelledBy(actor.getEmail());
            if (booking.getDepositStatus() == DepositStatus.PAID) {
                booking.setDepositStatus(DepositStatus.REFUNDED);
                markDepositPaymentRefunded(booking.getId(), booking.getCancelledAt());
                walletService.refundBookingDeposit(
                        booking.getUserId(),
                        booking.getId(),
                        booking.getDepositAmount(),
                        "booking:" + booking.getId() + ":transition-cancel-release",
                        "Deposit returned to wallet after admin cancellation"
                );
            }
        }

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingStatusChanged(savedBooking, request.getTargetStatus());
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse cancelBookingAsAdmin(String actorEmail, Long bookingId) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Chỉ admin hoặc staff mới được hủy booking");
        }

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return mapToResponse(booking);
        }
        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.CONFIRMED
                && booking.getStatus() != BookingStatus.PAID) {
            throw new IllegalArgumentException("Chỉ có thể hủy booking ở trạng thái PENDING, CONFIRMED hoặc PAID");
        }

        LocalDateTime cancelledAt = LocalDateTime.now();
        bookingStateMachineService.transition(
                booking,
                BookingStatus.CANCELLED,
                actor.getId(),
                actor.getRole(),
                "ADMIN_CANCELLED",
                "Booking bị hủy bởi admin/staff"
        );
        booking.setCancelledAt(cancelledAt);
        booking.setCancelReason("ADMIN_CANCELLED");
        booking.setCancelledBy(actor.getEmail());

        if (booking.getDepositStatus() == DepositStatus.PAID) {
            booking.setDepositStatus(DepositStatus.REFUNDED);
            markDepositPaymentRefunded(booking.getId(), cancelledAt);
            walletService.refundBookingDeposit(
                    booking.getUserId(),
                    booking.getId(),
                    booking.getDepositAmount(),
                    "booking:" + booking.getId() + ":admin-cancel-release",
                    "Deposit returned to wallet after admin cancellation"
            );
        } else if (booking.getDepositStatus() == DepositStatus.UNPAID) {
            var pendingPayments = paymentRepository.findByBookingIdAndStatus(
                    booking.getId(),
                    PaymentStatus.PENDING
            );
            pendingPayments.forEach(payment -> {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setFailureReason("Booking cancelled by admin");
            });
            paymentRepository.saveAll(pendingPayments);
        }

        return mapToResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse completeReturnInspection(
            String actorEmail,
            Long bookingId,
            CarConditionRequest request,
            List<MultipartFile> files
    ) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Only admin or staff can record a return condition");
        }
        if (request.getCondition() == null) {
            throw new IllegalArgumentException("Car condition is required");
        }
        if (request.isDamageFound() && request.getCondition() == CarCondition.GOOD) {
            throw new IllegalArgumentException("A car with damage cannot have GOOD return condition");
        }
        if (request.getCondition() == CarCondition.DAMAGE && !request.isDamageFound()) {
            throw new IllegalArgumentException("DAMAGE return condition must mark damage as found");
        }
        if (files == null || files.stream().noneMatch(file -> file != null && !file.isEmpty())) {
            throw new IllegalArgumentException("At least one return photo is required");
        }

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        if (booking.getStatus() != BookingStatus.ONGOING) {
            throw new IllegalArgumentException("Return condition can only be recorded for an ONGOING booking");
        }
        if (request.getActualReturnAt() == null) {
            throw new IllegalArgumentException("Actual return time is required");
        }
        if (request.getActualReturnAt().isBefore(booking.getStartTime())) {
            throw new IllegalArgumentException("Actual return time cannot be before the booking start time");
        }
        if (request.getOdometer() == null || request.getOdometer() < 0) {
            throw new IllegalArgumentException("Odometer must be zero or greater");
        }
        if (request.getFuelLevel() == null || request.getFuelLevel() < 0 || request.getFuelLevel() > 100) {
            throw new IllegalArgumentException("Fuel level must be between 0 and 100");
        }

        Car car = carRepository.findByIdForUpdate(booking.getCarId())
                .orElseThrow(() -> new ResourceNotFoundException("car", booking.getCarId()));
        CarConditionResponse preRentalCondition = carConditionService.getById(booking.getInitialConditionReportId());
        if (preRentalCondition != null && request.getOdometer() < preRentalCondition.getOdometer()) {
            throw new IllegalArgumentException("Return odometer cannot be lower than the pre-rental odometer");
        }

        carConditionService.createReturn(
                car.getId(),
                booking.getId(),
                request,
                actor.getId(),
                actor.getRole(),
                files
        );

        LocalDateTime actualReturnAt = request.getActualReturnAt();
        BigDecimal bookedSubtotal = bookedSubtotal(booking);
        OverdueFeeService.OverdueCharge overdueCharge = overdueFeeService.calculate(
                booking.getEndTime(),
                actualReturnAt,
                car.getPricePerDay()
        );

        bookingStateMachineService.transition(
                booking,
                BookingStatus.COMPLETED,
                actor.getId(),
                actor.getRole(),
                "RETURN_INSPECTION_COMPLETED",
                request.getNotes()
        );
        booking.setActualReturnAt(actualReturnAt);
        booking.setOverdueMinutes(overdueCharge.overdueMinutes());
        booking.setOverdueFee(overdueCharge.fee());
        booking.setPenaltyOverdueFee(overdueCharge.penaltyFee());
        booking.setTotalOverdueFee(overdueCharge.totalFee());
        booking.setTotalAmount(bookedSubtotal.add(overdueCharge.totalFee()));

        walletService.settleBooking(
                booking.getUserId(),
                booking.getId(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                actor.getId()
        );

        if (request.isDamageFound()) {
            damageAssessmentService.assessAndSettle(booking, request, actor.getId());
        } else {
            booking.setOutstandingAmount(overdueCharge.totalFee());
        }

        car.setStatus(request.getCondition() == CarCondition.NEED_MAINTENANCE
                ? CarStatus.MAINTENANCE
                : CarStatus.AVAILABLE);
        carRepository.save(car);
        return mapToResponse(bookingRepository.save(booking));
    }

    private void validateRequest(CreateBookingRequest request) {
        if (request.getPickupMethod() == VehiclePickupMethod.ADDRESS_DELIVERY
                && (request.getDeliveryAddress() == null || request.getDeliveryAddress().isBlank())) {
            throw new IllegalArgumentException("Delivery address is required for address delivery");
        }
        if (request.getPricingMode() == null) {
            return;
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            return;
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        LocalDateTime now = LocalDateTime.now();
        if (!request.getStartTime().isAfter(now)) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải ở tương lai");
        }

        Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
        switch (request.getPricingMode()) {
            case HOURLY -> {
                if (duration.toMinutes() < 60) {
                    throw new IllegalArgumentException("Booking theo giờ phải tối thiểu 1 giờ");
                }
            }
            case DAILY -> {
                if (duration.toHours() < 24) {
                    throw new IllegalArgumentException("Booking theo ngày phải tối thiểu 1 ngày");
                }
            }
            case MONTHLY -> {
                if (duration.toDays() < 30) {
                    throw new IllegalArgumentException("Booking theo tháng phải tối thiểu 30 ngày");
                }
            }
        }
    }

    private BookingResponse mapToResponse(Booking booking) {
        Map<Long, User> usersById = userRepository.findAllById(Set.of(booking.getUserId()))
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Car> carsById = carRepository.findAllById(Set.of(booking.getCarId()))
                .stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));
        return mapToResponse(booking, usersById, carsById);
    }

    private List<BookingResponse> mapToResponses(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = bookings.stream().map(Booking::getUserId).collect(Collectors.toSet());
        Set<Long> carIds = bookings.stream().map(Booking::getCarId).collect(Collectors.toSet());

        Map<Long, User> usersById = userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Car> carsById = carRepository.findAllById(carIds)
                .stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));

        return bookings.stream()
                .map(booking -> mapToResponse(booking, usersById, carsById))
                .toList();
    }

    private BookingResponse mapToResponse(Booking booking, Map<Long, User> usersById, Map<Long, Car> carsById) {
        User customer = usersById.get(booking.getUserId());
        Car car = carsById.get(booking.getCarId());
        String vehicleName = car != null ? buildVehicleName(car) : null;
        String primaryImageUrl = car != null
                ? extractPrimaryImageUrl(car)
                : null;

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .vehicleId(booking.getCarId())
                .userId(booking.getUserId())
                .vehicleName(vehicleName)
                .vehicleLicensePlate(car != null ? car.getLicensePlate() : null)
                .vehiclePrimaryImageUrl(primaryImageUrl)
                .vehiclePricePerDay(car != null ? car.getPricePerDay() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerEmail(customer != null ? customer.getEmail() : null)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .pickupMethod(booking.getPickupMethod() != null
                        ? booking.getPickupMethod()
                        : VehiclePickupMethod.BRANCH_PICKUP)
                .deliveryAddress(booking.getDeliveryAddress())
                .pricingMode(booking.getPricingMode())
                .status(booking.getStatus())
                .depositStatus(booking.getDepositStatus())
                .baseAmount(booking.getBaseAmount())
                .insuranceSelected(booking.isInsuranceSelected())
                .childSeatQuantity(booking.getChildSeatQuantity())
                .gpsSelected(booking.isGpsSelected())
                .extraServicesAmount(nonNull(booking.getExtraServicesAmount()))
                .deliveryFeeAmount(nonNull(booking.getDeliveryFeeAmount()))
                .depositAmount(booking.getDepositAmount())
                .reservationFeeStatus(booking.getDepositStatus())
                .reservationFeeAmount(booking.getDepositAmount())
                .securityDepositAmount(nonNull(booking.getSecurityDepositAmount()))
                .securityDepositStatus(booking.getSecurityDepositStatus())
                .securityDepositPaidAmount(nonNull(booking.getSecurityDepositPaidAmount()))
                .securityDepositCollectionMethod(booking.getSecurityDepositCollectionMethod())
                .securityDepositGateway(booking.getSecurityDepositGateway())
                .securityDepositPaidAt(booking.getSecurityDepositPaidAt())
                .securityDepositRefundMethod(booking.getSecurityDepositRefundMethod())
                .securityDepositResolvedAt(booking.getSecurityDepositResolvedAt())
                .securityDepositRepairCost(booking.getSecurityDepositRepairCost())
                .securityDepositRefundedAmount(nonNull(booking.getSecurityDepositRefundedAmount()))
                .finalRentalAmount(nonNull(booking.getFinalRentalAmount()))
                .finalPaymentStatus(booking.getFinalPaymentStatus())
                .finalPaymentMethod(booking.getFinalPaymentMethod())
                .finalPaymentGateway(resolveFinalPaymentGateway(booking.getId()))
                .finalPaidAt(booking.getFinalPaidAt())
                .totalAmount(booking.getTotalAmount())
                .freeCancelUntil(booking.getFreeCancelUntil())
                .paymentExpiresAt(bookingExpirationService.resolvePaymentDeadline(booking))
                .actualReturnAt(booking.getActualReturnAt())
                .overdueMinutes(booking.getOverdueMinutes() != null ? booking.getOverdueMinutes() : 0L)
                .overdueFee(booking.getOverdueFee() != null ? booking.getOverdueFee() : BigDecimal.ZERO)
                .penaltyOverdueFee(booking.getPenaltyOverdueFee() != null
                        ? booking.getPenaltyOverdueFee()
                        : BigDecimal.ZERO)
                .totalOverdueFee(booking.getTotalOverdueFee() != null
                        ? booking.getTotalOverdueFee()
                        : BigDecimal.ZERO)
                .damageFee(booking.getDamageFee() != null ? booking.getDamageFee() : BigDecimal.ZERO)
                .outstandingAmount(booking.getOutstandingAmount() != null
                        ? booking.getOutstandingAmount()
                        : BigDecimal.ZERO)
                .damageAssessment(damageAssessmentService.getByBooking(booking.getId()))
                .cancelledAt(booking.getCancelledAt())
                .cancelReason(booking.getCancelReason())
                .cancelledBy(booking.getCancelledBy())
                .initialCondition(carConditionService.getById(booking.getInitialConditionReportId()))
                .returnCondition(carConditionService.getBookingReport(
                        booking.getId(),
                        CarConditionReportType.RETURN
                ))
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private PaymentGateway resolveFinalPaymentGateway(Long bookingId) {
        if (bookingId == null) {
            return null;
        }
        return paymentRepository.findFirstByBookingIdAndTypeOrderByCreatedAtDesc(
                        bookingId,
                        PaymentType.FINAL_RENTAL_PAYMENT
                )
                .map(Payment::getGateway)
                .orElse(null);
    }

    private String normalizeDeliveryAddress(CreateBookingRequest request) {
        if (request.getPickupMethod() != VehiclePickupMethod.ADDRESS_DELIVERY) {
            return null;
        }
        return request.getDeliveryAddress().trim().replaceAll("\\s+", " ");
    }

    private int normalizeChildSeatQuantity(Integer quantity) {
        return quantity != null ? Math.max(0, quantity) : 0;
    }

    private BigDecimal bookedSubtotal(Booking booking) {
        return nonNull(booking.getBaseAmount())
                .add(nonNull(booking.getExtraServicesAmount()))
                .add(nonNull(booking.getDeliveryFeeAmount()));
    }

    private String buildVehicleName(Car car) {
        return (car.getBrand() + " " + car.getModel()).trim();
    }

    private Long resolveCurrentConditionId(Long carId) {
        CarConditionResponse condition = carConditionService.getCurrent(carId);
        return condition != null ? condition.getId() : null;
    }

    private void markDepositPaymentRefunded(Long bookingId, LocalDateTime refundedAt) {
        paymentRepository.findFirstByBookingIdAndTypeAndStatusOrderByCreatedAtDesc(
                bookingId,
                PaymentType.DEPOSIT,
                PaymentStatus.PAID
        ).ifPresent(payment -> {
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setRefundedAt(refundedAt != null ? refundedAt : LocalDateTime.now());
            paymentRepository.save(payment);
        });
    }

    private Specification<Booking> buildAdminBookingSpecification(
            BookingStatus status,
            Long vehicleId,
            Long userId,
            LocalDateTime fromTime,
            LocalDateTime toTime
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (vehicleId != null) {
                predicates.add(criteriaBuilder.equal(root.get("carId"), vehicleId));
            }
            if (userId != null) {
                predicates.add(criteriaBuilder.equal(root.get("userId"), userId));
            }
            if (fromTime != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startTime"), fromTime));
            }
            if (toTime != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("endTime"), toTime));
            }

            return predicates.isEmpty()
                    ? criteriaBuilder.conjunction()
                    : criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private String extractPrimaryImageUrl(Car car) {
        if (car.getImages() == null || car.getImages().isEmpty()) {
            return null;
        }

        return car.getImages().stream()
                .filter(CarImage::isPrimary)
                .map(CarImage::getImageUrl)
                .findFirst()
                .orElseGet(() -> car.getImages().stream()
                        .map(CarImage::getImageUrl)
                        .findFirst()
                        .orElse(null));
    }

    private String normalizeReason(String reason, BookingStatus targetStatus) {
        if (reason != null && !reason.isBlank()) {
            return reason.trim();
        }
        return switch (targetStatus) {
            case CONFIRMED -> "ADMIN_CONFIRMED";
            case PAID -> "BALANCE_PAID";
            case ONGOING -> "ADMIN_CHECKOUT";
            case COMPLETED -> "ADMIN_COMPLETED";
            case CANCELLED -> "ADMIN_CANCELLED";
            case PENDING -> "ADMIN_REVERTED_TO_PENDING";
        };
    }

    private String buildCancelNote(DepositStatus depositStatus, LocalDateTime cancelledAt, LocalDateTime freeCancelUntil) {
        boolean freeCancellation = !cancelledAt.isAfter(freeCancelUntil);
        if (depositStatus == DepositStatus.REFUNDED) {
            return "Khách hủy trong thời gian miễn phí, tiền cọc được hoàn";
        }
        if (depositStatus == DepositStatus.FORFEITED) {
            return "Khách hủy sau thời hạn miễn phí, tiền cọc bị mất";
        }
        if (freeCancellation) {
            return "Khách hủy booking trước thời hạn miễn phí";
        }
        return "Khách hủy booking sau thời hạn miễn phí";
    }

    private String generateBookingCode() {
        String datePart = LocalDate.now().format(BOOKING_DATE_FORMAT);
        String randomPart = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase(Locale.ROOT);
        return "RC-" + datePart + "-" + randomPart;
    }

    @Transactional
    public BookingResponse prepareSecurityDeposit(
            Long bookingId,
            String actorEmail,
            SecurityDepositCollectionRequest request
    ) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (request != null) {
            if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
                throw new IllegalArgumentException("Only staff can collect a vehicle security deposit");
            }
            if (booking.getStatus() == BookingStatus.PAID
                    && booking.getSecurityDepositStatus() == SecurityDepositStatus.PAID) {
                return mapToResponse(booking);
            }
            if (booking.getStatus() != BookingStatus.CONFIRMED) {
                throw new IllegalArgumentException(
                        "Security deposit can only be collected for a CONFIRMED booking"
                );
            }

            BigDecimal requiredDeposit = nonNull(booking.getSecurityDepositAmount());
            if (requiredDeposit.signum() <= 0) {
                throw new IllegalArgumentException("This vehicle does not have a valid security deposit amount");
            }

            booking.setSecurityDepositCollectionMethod(request.getMethod());
            if (request.getMethod() == SettlementMethod.CASH) {
                booking.setSecurityDepositPaidAmount(requiredDeposit);
                booking.setSecurityDepositStatus(SecurityDepositStatus.PAID);
                booking.setSecurityDepositPaidAt(LocalDateTime.now());
                booking.setSecurityDepositGateway(PaymentGateway.CASH);
                booking.setOutstandingAmount(BigDecimal.ZERO);
                recordCashPayment(booking, PaymentType.SECURITY_DEPOSIT, requiredDeposit, actor.getId());
                transitionToPaidIfSettled(booking, actor.getId(), actor.getRole());
            } else {
                BigDecimal remaining = requiredDeposit.subtract(nonNull(booking.getSecurityDepositPaidAmount()))
                        .max(BigDecimal.ZERO);
                booking.setSecurityDepositStatus(SecurityDepositStatus.PAYMENT_REQUESTED);
                booking.setOutstandingAmount(remaining);
            }
            return mapToResponse(bookingRepository.save(booking));
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Chỉ có thể yêu cầu check-in cho booking đã được xác nhận (CONFIRMED).");
        }

        if (booking.getOutstandingAmount() != null && booking.getOutstandingAmount().signum() > 0) {
            return mapToResponse(booking);
        }

        BigDecimal remainingBalance = booking.getTotalAmount().subtract(booking.getDepositAmount()).max(BigDecimal.ZERO);
        // Payment readiness never starts the rental; the signed handover does that.
        if (remainingBalance.signum() > 0) {
            booking.setOutstandingAmount(remainingBalance);
            bookingRepository.save(booking);
        } else {
            transitionToPaidIfSettled(booking, actor.getId(), actor.getRole());
        }
        return mapToResponse(booking);
    }

    @Transactional
    public void applyCustomerPayment(
            Long bookingId,
            BigDecimal amount,
            Long customerId,
            Long paymentId,
            PaymentType paymentType,
            PaymentGateway paymentGateway
    ) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        if (!booking.getUserId().equals(customerId)) {
            throw new ResourceNotFoundException("booking", bookingId);
        }

        BigDecimal outstanding = booking.getOutstandingAmount();
        if (outstanding == null || outstanding.signum() <= 0) {
            return;
        }

        BigDecimal paid = amount.min(outstanding);
        if (paymentType == PaymentType.SECURITY_DEPOSIT) {
            booking.setSecurityDepositPaidAmount(nonNull(booking.getSecurityDepositPaidAmount()).add(paid));
            booking.setOutstandingAmount(outstanding.subtract(paid).max(BigDecimal.ZERO));
            if (booking.getOutstandingAmount().signum() == 0) {
                booking.setSecurityDepositStatus(SecurityDepositStatus.PAID);
                booking.setSecurityDepositPaidAt(LocalDateTime.now());
                booking.setSecurityDepositGateway(paymentGateway);
            }
            transitionToPaidIfSettled(booking, customerId, Role.CUSTOMER);
            bookingRepository.save(booking);
            return;
        }

        if (paymentType == PaymentType.FINAL_RENTAL_PAYMENT) {
            booking.setOutstandingAmount(outstanding.subtract(paid).max(BigDecimal.ZERO));
            if (booking.getOutstandingAmount().signum() == 0) {
                booking.setFinalPaymentStatus(FinalPaymentStatus.PAID);
                booking.setFinalPaidAt(LocalDateTime.now());
                markContractFinalPaymentPaid(bookingId);
            }
            bookingRepository.save(booking);
            return;
        }

        BigDecimal outstandingOverdue = booking.getTotalOverdueFee() != null ? booking.getTotalOverdueFee() : BigDecimal.ZERO;
        BigDecimal outstandingDamage = booking.getDamageFee() != null ? booking.getDamageFee() : BigDecimal.ZERO;
        
        BigDecimal alreadyPaidTotal = outstandingOverdue.add(outstandingDamage).subtract(outstanding);
        BigDecimal remainingOverdue = outstandingOverdue.subtract(alreadyPaidTotal).max(BigDecimal.ZERO);
        BigDecimal remainingDamage = outstanding.subtract(remainingOverdue).max(BigDecimal.ZERO);

        BigDecimal requestedOverdue = amount.min(remainingOverdue);
        BigDecimal requestedDamage = amount.subtract(requestedOverdue).min(remainingDamage);

        WalletService.SettlementResult settlement = walletService.settleBooking(
                customerId,
                bookingId,
                requestedOverdue,
                requestedDamage,
                customerId
        );

        BigDecimal paidOverdue = settlement.overduePaid();
        BigDecimal paidDamage = settlement.damagePaid();
        BigDecimal totalPaid = paidOverdue.add(paidDamage);

        if (totalPaid.signum() > 0) {
            booking.setOutstandingAmount(booking.getOutstandingAmount().subtract(totalPaid).max(BigDecimal.ZERO));
            bookingRepository.save(booking);
            damageAssessmentService.updatePaidAmount(bookingId, paidDamage);
            
        }
    }

    private void transitionToPaidIfSettled(Booking booking, Long actorId, Role actorRole) {
        if (booking.getStatus() != BookingStatus.CONFIRMED
                || booking.getSecurityDepositStatus() != SecurityDepositStatus.PAID
                || booking.getOutstandingAmount() == null
                || booking.getOutstandingAmount().signum() > 0) {
            return;
        }
        bookingStateMachineService.transition(
                booking,
                BookingStatus.PAID,
                actorId,
                actorRole,
                "SECURITY_DEPOSIT_PAID",
                "Vehicle security deposit paid in full"
        );
        notificationService.notifyBookingStatusChanged(booking, BookingStatus.PAID);
    }

    private void recordCashPayment(Booking booking, PaymentType type, BigDecimal amount, Long actorId) {
        paymentRepository.save(Payment.builder()
                .bookingId(booking.getId())
                .userId(booking.getUserId())
                .type(type)
                .gateway(PaymentGateway.CASH)
                .status(PaymentStatus.PAID)
                .amount(amount)
                .currency("VND")
                .gatewayReference("CASH-" + UUID.randomUUID())
                .gatewayTransactionId("STAFF-" + actorId)
                .idempotencyKey("cash-" + type + "-" + booking.getId() + "-" + UUID.randomUUID())
                .paidAt(LocalDateTime.now())
                .build());
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void markContractFinalPaymentPaid(Long bookingId) {
        rentalContractRepository.findByBookingId(bookingId).ifPresent(contract -> {
            contract.setFinalPaymentStatus(FinalPaymentStatus.PAID);
            rentalContractRepository.save(contract);
        });
    }
}
