package com.rentcity.Rentcity.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class OverdueFeeService {

    private static final BigDecimal HOURS_PER_DAY = BigDecimal.valueOf(24);
    private static final BigDecimal PENALTY_RATE = new BigDecimal("0.15");

    public OverdueCharge calculate(
            LocalDateTime scheduledReturn,
            LocalDateTime actualReturn,
            BigDecimal pricePerDay,
            BigDecimal originalRentalFee
    ) {
        if (scheduledReturn == null || actualReturn == null || !actualReturn.isAfter(scheduledReturn)) {
            return new OverdueCharge(0L, 0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        long overdueSeconds = Duration.between(scheduledReturn, actualReturn).getSeconds();
        long overdueMinutes = divideAndRoundUp(overdueSeconds, 60);
        long billableHours = divideAndRoundUp(overdueSeconds, 3600);
        BigDecimal hourlyRate = pricePerDay
                .divide(HOURS_PER_DAY, 0, RoundingMode.CEILING);
        BigDecimal fee = hourlyRate.multiply(BigDecimal.valueOf(billableHours));
        BigDecimal penaltyFee = originalRentalFee
                .add(fee)
                .multiply(PENALTY_RATE)
                .setScale(0, RoundingMode.CEILING);
        BigDecimal totalFee = fee.add(penaltyFee);

        return new OverdueCharge(overdueMinutes, billableHours, fee, penaltyFee, totalFee);
    }

    private long divideAndRoundUp(long value, long divisor) {
        return (value + divisor - 1) / divisor;
    }

    public record OverdueCharge(
            long overdueMinutes,
            long billableHours,
            BigDecimal fee,
            BigDecimal penaltyFee,
            BigDecimal totalFee
    ) {
    }
}
