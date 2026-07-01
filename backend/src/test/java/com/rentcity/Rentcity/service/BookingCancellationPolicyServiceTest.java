package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.PricingMode;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class BookingCancellationPolicyServiceTest {

    private final BookingCancellationPolicyService service = new BookingCancellationPolicyService();

    @Test
    void lastMinuteBookingHasNoFreeCancellationWindow() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 7, 1, 10, 0);
        LocalDateTime startTime = createdAt.plusHours(20);

        LocalDateTime freeCancelUntil = service.calculateFreeCancelUntil(startTime, PricingMode.DAILY, createdAt);

        assertThat(freeCancelUntil).isEqualTo(createdAt);
    }

    @Test
    void customerCancelIsNotFreeWhenCreatedLessThan24HoursBeforeStart() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 7, 1, 10, 0);
        Booking booking = Booking.builder()
                .createdAt(createdAt)
                .startTime(createdAt.plusHours(20))
                .freeCancelUntil(createdAt)
                .depositStatus(DepositStatus.PAID)
                .build();

        DepositStatus result = service.determineDepositStatusAfterCustomerCancel(
                booking,
                createdAt.plusMinutes(1)
        );

        assertThat(result).isEqualTo(DepositStatus.FORFEITED);
    }

    @Test
    void normalBookingKeepsFreeCancellationUntil24HoursBeforeStart() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 7, 1, 10, 0);
        LocalDateTime startTime = createdAt.plusHours(48);

        LocalDateTime freeCancelUntil = service.calculateFreeCancelUntil(startTime, PricingMode.DAILY, createdAt);

        assertThat(freeCancelUntil).isEqualTo(startTime.minusHours(24));
    }
}
