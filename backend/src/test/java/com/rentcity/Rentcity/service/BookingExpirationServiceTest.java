package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.Payment;
import com.rentcity.Rentcity.entity.PaymentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BookingExpirationServiceTest {

    private BookingExpirationService expirationService;

    @BeforeEach
    void setUp() {
        expirationService = new BookingExpirationService(null, null, null);
        ReflectionTestUtils.setField(expirationService, "paymentHoldMinutes", 15L);
    }

    @Test
    void appliesCancellationMetadataAndExpiresPendingPayments() {
        Booking booking = Booking.builder().id(42L).build();
        Payment payment = Payment.builder()
                .id(7L)
                .bookingId(42L)
                .status(PaymentStatus.PENDING)
                .build();
        LocalDateTime expiredAt = LocalDateTime.now();

        expirationService.applyExpirationMetadata(booking, List.of(payment), expiredAt);

        assertThat(booking.getCancelledAt()).isEqualTo(expiredAt);
        assertThat(booking.getCancelReason()).isEqualTo("SYSTEM_CANCELLED");
        assertThat(booking.getCancelledBy()).isEqualTo("SYSTEM");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.EXPIRED);
        assertThat(payment.getFailureReason()).isEqualTo("Booking payment window expired");
    }

    @Test
    void resolvesLegacyDeadlineFromCreatedAt() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 6, 8, 10, 0);
        Booking booking = Booking.builder().createdAt(createdAt).build();

        assertThat(expirationService.resolvePaymentDeadline(booking))
                .isEqualTo(createdAt.plusMinutes(15));
        assertThat(expirationService.isPaymentExpired(
                booking,
                createdAt.plusMinutes(15)
        )).isTrue();
    }

    @Test
    void createsDeadlineFifteenMinutesAhead() {
        LocalDateTime before = LocalDateTime.now().plusMinutes(15);
        LocalDateTime deadline = expirationService.newPaymentDeadline();
        LocalDateTime after = LocalDateTime.now().plusMinutes(15);

        assertThat(deadline).isBetween(before, after);
    }
}
