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
            BigDecimal pricePerDay
    ) {
        return calculate(null, null, scheduledReturn, actualReturn, pricePerDay);
    }

    public OverdueCharge calculate(
            LocalDateTime scheduledStart,
            LocalDateTime actualHandover,
            LocalDateTime scheduledReturn,
            LocalDateTime actualReturn,
            BigDecimal pricePerDay
    ) {
        long lateReturnSeconds = secondsBefore(scheduledReturn, actualReturn);
        if (lateReturnSeconds <= 0) {
            return new OverdueCharge(0L, 0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        long earlyHandoverSeconds = secondsBefore(actualHandover, scheduledStart);
        long additionalUsageSeconds = earlyHandoverSeconds + lateReturnSeconds;

        long overdueMinutes = divideAndRoundUp(additionalUsageSeconds, 60);
        long billableHours = divideAndRoundUp(additionalUsageSeconds, 3600);
        BigDecimal hourlyRate = pricePerDay
                .divide(HOURS_PER_DAY, 0, RoundingMode.CEILING);
        BigDecimal fee = hourlyRate.multiply(BigDecimal.valueOf(billableHours));
        BigDecimal penaltyFee = fee
                .multiply(PENALTY_RATE)
                .setScale(0, RoundingMode.CEILING);
        BigDecimal totalFee = fee.add(penaltyFee);

        return new OverdueCharge(overdueMinutes, billableHours, fee, penaltyFee, totalFee);
    }

    private long secondsBefore(LocalDateTime earlier, LocalDateTime later) {
        if (earlier == null || later == null || !earlier.isBefore(later)) {
            return 0L;
        }
        return Duration.between(earlier, later).getSeconds();
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
