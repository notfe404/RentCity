package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.BookingQuote;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.PricingMode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class BookingPricingServiceTest {

    private final BookingPricingService pricingService =
            new BookingPricingService(new BookingCancellationPolicyService());

    @Test
    void dailyPricingChargesFullDaysPlusRemainingHours() {
        Car car = Car.builder()
                .pricePerDay(new BigDecimal("2400000"))
                .build();
        LocalDateTime start = LocalDateTime.of(2026, 6, 8, 9, 0);
        LocalDateTime end = start.plusHours(25);

        BookingQuote quote = pricingService.calculateQuote(car, start, end, PricingMode.DAILY);

        assertThat(quote.getBaseAmount()).isEqualByComparingTo("2500000");
        assertThat(quote.getTotalAmount()).isEqualByComparingTo("2500000");
        assertThat(quote.getDepositAmount()).isEqualByComparingTo("750000");
    }

    @Test
    void dailyPricingRoundsPartialRemainingHourUpToOneHour() {
        Car car = Car.builder()
                .pricePerDay(new BigDecimal("2400000"))
                .build();
        LocalDateTime start = LocalDateTime.of(2026, 6, 8, 9, 0);
        LocalDateTime end = start.plusDays(1).plusMinutes(5);

        BookingQuote quote = pricingService.calculateQuote(car, start, end, PricingMode.DAILY);

        assertThat(quote.getBaseAmount()).isEqualByComparingTo("2500000");
    }
}
