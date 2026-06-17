package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.Payment;
import com.rentcity.Rentcity.entity.PaymentStatus;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingExpirationService {

    private static final String TIMEOUT_HISTORY_REASON = "SYSTEM_PAYMENT_TIMEOUT";
    private static final String SYSTEM_CANCEL_REASON = "SYSTEM_CANCELLED";
    private static final String TIMEOUT_NOTE = "Booking automatically cancelled after payment window expired";

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final BookingStateMachineService bookingStateMachineService;

    @Value("${booking.payment-hold-minutes:15}")
    private long paymentHoldMinutes;

    public LocalDateTime newPaymentDeadline() {
        return LocalDateTime.now().plusMinutes(paymentHoldMinutes);
    }

    public LocalDateTime resolvePaymentDeadline(Booking booking) {
        if (booking.getPaymentExpiresAt() != null) {
            return booking.getPaymentExpiresAt();
        }
        return booking.getCreatedAt() != null
                ? booking.getCreatedAt().plusMinutes(paymentHoldMinutes)
                : null;
    }

    public boolean isPaymentExpired(Booking booking, LocalDateTime now) {
        LocalDateTime deadline = resolvePaymentDeadline(booking);
        return deadline != null && !now.isBefore(deadline);
    }

    @Scheduled(fixedDelayString = "${booking.expiration-check-delay-ms:5000}")
    @Transactional
    public void cancelExpiredUnpaidBookings() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime legacyCutoff = now.minusMinutes(paymentHoldMinutes);

        var expiredBookings = bookingRepository.findExpiredUnpaidBookingsForUpdate(
                BookingStatus.PENDING,
                DepositStatus.UNPAID,
                now,
                legacyCutoff
        );

        for (Booking booking : expiredBookings) {
            bookingStateMachineService.transition(
                    booking,
                    BookingStatus.CANCELLED,
                    null,
                    null,
                    TIMEOUT_HISTORY_REASON,
                    TIMEOUT_NOTE
            );

            var pendingPayments = paymentRepository.findByBookingIdAndStatus(
                    booking.getId(),
                    PaymentStatus.PENDING
            );
            applyExpirationMetadata(booking, pendingPayments, now);
            paymentRepository.saveAll(pendingPayments);
        }

        bookingRepository.saveAll(expiredBookings);
    }

    void applyExpirationMetadata(
            Booking booking,
            List<Payment> pendingPayments,
            LocalDateTime now
    ) {
        booking.setCancelledAt(now);
        booking.setCancelReason(SYSTEM_CANCEL_REASON);
        booking.setCancelledBy("SYSTEM");

        pendingPayments.forEach(payment -> {
            payment.setStatus(PaymentStatus.EXPIRED);
            payment.setFailureReason("Booking payment window expired");
        });
    }
}
