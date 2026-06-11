package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CapturePaymentRequest;
import com.rentcity.Rentcity.dto.CreatePaymentRequest;
import com.rentcity.Rentcity.dto.PaymentResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.PaymentRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String DEFAULT_CURRENCY = "VND";
    private static final Set<PaymentStatus> ACTIVE_PAYMENT_STATUSES =
            Set.of(PaymentStatus.PENDING, PaymentStatus.PAID);

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BookingStateMachineService bookingStateMachineService;
    private final BookingCancellationPolicyService bookingCancellationPolicyService;
    private final NotificationService notificationService;

    @Value("${payment.public-base-url:http://localhost:8080/api}")
    private String publicBaseUrl;

    @Transactional
    public PaymentResponse createDepositPayment(String email, CreatePaymentRequest request) {
        User user = findUserByEmail(email);
        Booking booking = bookingRepository.findByIdForUpdate(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("booking", request.getBookingId()));

        ensureBookingOwner(user, booking);
        ensureBookingCanAcceptDeposit(booking);

        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            var existingByKey = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey().trim());
            if (existingByKey.isPresent()) {
                Payment existing = existingByKey.get();
                ensurePaymentOwner(user, existing);
                return mapToResponse(existing, booking);
            }
        }

        var existingPaid = paymentRepository.findFirstByBookingIdAndTypeAndStatusOrderByCreatedAtDesc(
                booking.getId(),
                PaymentType.DEPOSIT,
                PaymentStatus.PAID
        );
        if (existingPaid.isPresent()) {
            return mapToResponse(existingPaid.get(), booking);
        }

        var existingActive = paymentRepository.findFirstByBookingIdAndGatewayAndTypeAndStatusInOrderByCreatedAtDesc(
                booking.getId(),
                request.getGateway(),
                PaymentType.DEPOSIT,
                ACTIVE_PAYMENT_STATUSES
        );
        if (existingActive.isPresent()) {
            return mapToResponse(existingActive.get(), booking);
        }

        Payment payment = Payment.builder()
                .bookingId(booking.getId())
                .userId(user.getId())
                .type(PaymentType.DEPOSIT)
                .gateway(request.getGateway())
                .status(PaymentStatus.PENDING)
                .amount(booking.getDepositAmount())
                .currency(DEFAULT_CURRENCY)
                .gatewayReference(generateGatewayReference(request.getGateway()))
                .idempotencyKey(normalizeIdempotencyKey(request.getIdempotencyKey()))
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        notificationService.notifyPaymentPending(savedPayment, booking);
        return mapToResponse(savedPayment, booking);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getMyPayments(String email) {
        User user = findUserByEmail(email);
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAdminPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public PaymentResponse capturePaypalPayment(String email, Long paymentId, CapturePaymentRequest request) {
        User user = findUserByEmail(email);
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("payment", paymentId));
        ensurePaymentOwner(user, payment);
        ensureGateway(payment, PaymentGateway.PAYPAL);

        String transactionId = request != null && request.getGatewayTransactionId() != null
                ? request.getGatewayTransactionId()
                : "PAYPAL-" + UUID.randomUUID();
        return completePayment(payment, transactionId, "PAYPAL_CAPTURED", "Paypal payment captured", user);
    }

    @Transactional
    public PaymentResponse handleVnpayCallback(String reference, String responseCode, String transactionNo) {
        Payment payment = paymentRepository.findByGatewayReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("payment reference", reference));
        ensureGateway(payment, PaymentGateway.VNPAY);

        if ("00".equals(responseCode)) {
            String transactionId = transactionNo != null && !transactionNo.isBlank()
                    ? transactionNo
                    : "VNPAY-" + UUID.randomUUID();
            return completePayment(payment, transactionId, "VNPAY_CALLBACK_SUCCESS", "VNPay callback confirmed", null);
        }

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason("VNPay response code: " + responseCode);
        Payment savedPayment = paymentRepository.save(payment);
        notificationService.notifyPaymentStatusChanged(savedPayment, PaymentStatus.FAILED);
        return mapToResponse(savedPayment);
    }

    @Transactional
    public PaymentResponse mockPaymentSuccess(String email, Long paymentId) {
        User user = findUserByEmail(email);
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("payment", paymentId));
        ensurePaymentOwner(user, payment);

        String transactionId = payment.getGateway().name() + "-MOCK-" + UUID.randomUUID();
        return completePayment(payment, transactionId, payment.getGateway().name() + "_MOCK_SUCCESS", "Mock gateway success", user);
    }

    @Transactional
    public PaymentResponse refundPayment(String email, Long paymentId) {
        User actor = findUserByEmail(email);
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("payment", paymentId));
        Booking booking = bookingRepository.findByIdForUpdate(payment.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("booking", payment.getBookingId()));

        if (!isStaffOrAdmin(actor)) {
            ensureBookingOwner(actor, booking);
        }

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            return mapToResponse(payment, booking);
        }
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("Only paid payments can be refunded");
        }
        if (booking.getStatus() != BookingStatus.CANCELLED || booking.getCancelledAt() == null) {
            throw new IllegalArgumentException("Booking must be cancelled before refund");
        }
        if (!bookingCancellationPolicyService.isFreeCancellation(booking, booking.getCancelledAt())) {
            throw new IllegalArgumentException("Refund is only allowed when booking is cancelled at least 24 hours before start time");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefundedAt(LocalDateTime.now());
        booking.setDepositStatus(DepositStatus.REFUNDED);

        bookingRepository.save(booking);
        Payment savedPayment = paymentRepository.save(payment);
        notificationService.notifyPaymentStatusChanged(savedPayment, PaymentStatus.REFUNDED);
        return mapToResponse(savedPayment, booking);
    }

    private PaymentResponse completePayment(
            Payment payment,
            String gatewayTransactionId,
            String reason,
            String note,
            User actor
    ) {
        if (payment.getStatus() == PaymentStatus.PAID) {
            return mapToResponse(payment);
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending payments can be completed");
        }

        Booking booking = bookingRepository.findByIdForUpdate(payment.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("booking", payment.getBookingId()));
        User customer = userRepository.findById(payment.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("user", payment.getUserId()));
        User changedBy = actor != null ? actor : customer;

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot complete payment for cancelled booking");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setGatewayTransactionId(gatewayTransactionId);
        payment.setPaidAt(LocalDateTime.now());
        payment.setFailureReason(null);

        if (payment.getType() == PaymentType.DEPOSIT) {
            booking.setDepositStatus(DepositStatus.PAID);
        }

        boolean bookingWasPending = booking.getStatus() == BookingStatus.PENDING;
        if (bookingWasPending) {
            bookingStateMachineService.transition(
                    booking,
                    BookingStatus.CONFIRMED,
                    changedBy.getId(),
                    changedBy.getRole(),
                    reason,
                    note
            );
        }

        bookingRepository.save(booking);
        Payment savedPayment = paymentRepository.save(payment);
        notificationService.notifyPaymentStatusChanged(savedPayment, PaymentStatus.PAID);
        if (bookingWasPending) {
            notificationService.notifyBookingStatusChanged(booking, BookingStatus.CONFIRMED);
        }
        return mapToResponse(savedPayment, booking);
    }

    private void ensureBookingCanAcceptDeposit(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Booking must be pending before deposit payment");
        }
        if (booking.getDepositStatus() == DepositStatus.PAID) {
            throw new IllegalArgumentException("Deposit has already been paid");
        }
    }

    private void ensureBookingOwner(User user, Booking booking) {
        if (!booking.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("booking", booking.getId());
        }
    }

    private void ensurePaymentOwner(User user, Payment payment) {
        if (!payment.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("payment", payment.getId());
        }
    }

    private void ensureGateway(Payment payment, PaymentGateway gateway) {
        if (payment.getGateway() != gateway) {
            throw new IllegalArgumentException("Payment gateway must be " + gateway);
        }
    }

    private void ensureStaffOrAdmin(User user) {
        if (!isStaffOrAdmin(user)) {
            throw new IllegalArgumentException("Only staff or admin can perform this payment action");
        }
    }

    private boolean isStaffOrAdmin(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.STAFF;
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String normalizeIdempotencyKey(String value) {
        if (value == null || value.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return value.trim();
    }

    private String generateGatewayReference(PaymentGateway gateway) {
        return gateway.name().toLowerCase(Locale.ROOT) + "-" + UUID.randomUUID();
    }

    private PaymentResponse mapToResponse(Payment payment) {
        Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
        return mapToResponse(payment, booking);
    }

    private PaymentResponse mapToResponse(Payment payment, Booking booking) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBookingId())
                .bookingCode(booking != null ? booking.getBookingCode() : null)
                .userId(payment.getUserId())
                .type(payment.getType())
                .gateway(payment.getGateway())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .gatewayReference(payment.getGatewayReference())
                .gatewayTransactionId(payment.getGatewayTransactionId())
                .paymentUrl(buildPaymentUrl(payment))
                .failureReason(payment.getFailureReason())
                .paidAt(payment.getPaidAt())
                .refundedAt(payment.getRefundedAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private String buildPaymentUrl(Payment payment) {
        if (payment.getGateway() == PaymentGateway.VNPAY && payment.getStatus() == PaymentStatus.PENDING) {
            return publicBaseUrl
                    + "/payments/vnpay/callback?reference="
                    + payment.getGatewayReference()
                    + "&vnp_ResponseCode=00&vnp_TransactionNo=VNPAY-MOCK-"
                    + payment.getId();
        }
        return null;
    }
}
