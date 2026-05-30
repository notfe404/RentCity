package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.BookingQuote;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.PricingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BookingPricingService {

    private static final BigDecimal HOURS_PER_DAY = BigDecimal.valueOf(24);
    private static final BigDecimal TEN_PERCENT = new BigDecimal("0.10");
    private static final long MINUTES_PER_HOUR = 60;
    private static final long MINUTES_PER_DAY = 24 * 60;

    private final BookingCancellationPolicyService bookingCancellationPolicyService;

    public BookingQuote calculateQuote(
            Car car,
            LocalDateTime startTime,
            LocalDateTime endTime,
            PricingMode pricingMode
    ) {
        long totalMinutes = Duration.between(startTime, endTime).toMinutes();
        BigDecimal baseAmount = switch (pricingMode) {
            case HOURLY -> calculateHourlyAmount(car.getPricePerDay(), totalMinutes);
            case DAILY -> calculateDailyAmount(car.getPricePerDay(), totalMinutes);
            case MONTHLY -> calculateMonthlyAmount(car.getPricePerDay(), totalMinutes);
        };

        BigDecimal depositAmount = baseAmount.multiply(TEN_PERCENT).setScale(0, RoundingMode.HALF_UP);

        return BookingQuote.builder()
                .baseAmount(baseAmount)
                .depositAmount(depositAmount)
                .totalAmount(baseAmount)
                .freeCancelUntil(bookingCancellationPolicyService.calculateFreeCancelUntil(startTime, pricingMode))
                .build();
    }

    private BigDecimal calculateHourlyAmount(BigDecimal pricePerDay, long totalMinutes) {
        long billableHours = ceilDiv(totalMinutes, MINUTES_PER_HOUR);
        BigDecimal hourlyRate = pricePerDay.divide(HOURS_PER_DAY, 0, RoundingMode.HALF_UP);
        return hourlyRate.multiply(BigDecimal.valueOf(billableHours));
    }

    private BigDecimal calculateDailyAmount(BigDecimal pricePerDay, long totalMinutes) {
        long billableDays = ceilDiv(totalMinutes, MINUTES_PER_DAY);
        return pricePerDay.multiply(BigDecimal.valueOf(billableDays));
    }

    private BigDecimal calculateMonthlyAmount(BigDecimal pricePerDay, long totalMinutes) {
        long billableDays = ceilDiv(totalMinutes, MINUTES_PER_DAY);
        long billableMonths = ceilDiv(billableDays, 30);
        return pricePerDay.multiply(BigDecimal.valueOf(30L * billableMonths));
    }

    private long ceilDiv(long numerator, long denominator) {
        return (numerator + denominator - 1) / denominator;
    }
}
