package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.BookingQuote;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.PricingMode;
import com.rentcity.Rentcity.entity.VehiclePickupMethod;
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
    private static final BigDecimal THIRTY_PERCENT = new BigDecimal("0.30");
    private static final BigDecimal INSURANCE_PRICE_PER_DAY = BigDecimal.valueOf(200_000);
    private static final BigDecimal CHILD_SEAT_PRICE_PER_DAY = BigDecimal.valueOf(100_000);
    private static final BigDecimal GPS_PRICE_PER_DAY = BigDecimal.valueOf(50_000);
    private static final BigDecimal ADDRESS_DELIVERY_FEE = BigDecimal.valueOf(200_000);
    private static final long MINUTES_PER_HOUR = 60;
    private static final long MINUTES_PER_DAY = 24 * 60;

    private final BookingCancellationPolicyService bookingCancellationPolicyService;

    public BookingQuote calculateQuote(
            Car car,
            LocalDateTime startTime,
            LocalDateTime endTime,
            PricingMode pricingMode
    ) {
        return calculateQuote(
                car,
                startTime,
                endTime,
                pricingMode,
                VehiclePickupMethod.BRANCH_PICKUP,
                false,
                0,
                false
        );
    }

    public BookingQuote calculateQuote(
            Car car,
            LocalDateTime startTime,
            LocalDateTime endTime,
            PricingMode pricingMode,
            VehiclePickupMethod pickupMethod,
            boolean insuranceSelected,
            int childSeatQuantity,
            boolean gpsSelected
    ) {
        long totalMinutes = Duration.between(startTime, endTime).toMinutes();
        BigDecimal baseAmount = switch (pricingMode) {
            case HOURLY -> calculateHourlyAmount(car.getPricePerDay(), totalMinutes);
            case DAILY -> calculateDailyAmount(car.getPricePerDay(), totalMinutes);
            case MONTHLY -> calculateMonthlyAmount(car.getPricePerDay(), totalMinutes);
        };
        BigDecimal extraServicesAmount = calculateExtraServicesAmount(
                totalMinutes,
                insuranceSelected,
                childSeatQuantity,
                gpsSelected
        );
        BigDecimal deliveryFeeAmount = pickupMethod == VehiclePickupMethod.ADDRESS_DELIVERY
                ? ADDRESS_DELIVERY_FEE
                : BigDecimal.ZERO;
        BigDecimal totalAmount = baseAmount.add(extraServicesAmount).add(deliveryFeeAmount);

        BigDecimal depositAmount = baseAmount.multiply(THIRTY_PERCENT).setScale(0, RoundingMode.HALF_UP);

        return BookingQuote.builder()
                .baseAmount(baseAmount)
                .extraServicesAmount(extraServicesAmount)
                .deliveryFeeAmount(deliveryFeeAmount)
                .depositAmount(depositAmount)
                .totalAmount(totalAmount)
                .freeCancelUntil(bookingCancellationPolicyService.calculateFreeCancelUntil(startTime, pricingMode))
                .build();
    }

    private BigDecimal calculateExtraServicesAmount(
            long totalMinutes,
            boolean insuranceSelected,
            int childSeatQuantity,
            boolean gpsSelected
    ) {
        long billableDays = Math.max(1, ceilDiv(totalMinutes, MINUTES_PER_DAY));
        BigDecimal days = BigDecimal.valueOf(billableDays);

        BigDecimal amount = BigDecimal.ZERO;
        if (insuranceSelected) {
            amount = amount.add(INSURANCE_PRICE_PER_DAY.multiply(days));
        }
        if (childSeatQuantity > 0) {
            amount = amount.add(CHILD_SEAT_PRICE_PER_DAY
                    .multiply(BigDecimal.valueOf(childSeatQuantity))
                    .multiply(days));
        }
        if (gpsSelected) {
            amount = amount.add(GPS_PRICE_PER_DAY.multiply(days));
        }
        return amount;
    }

    private BigDecimal calculateHourlyAmount(BigDecimal pricePerDay, long totalMinutes) {
        long billableHours = ceilDiv(totalMinutes, MINUTES_PER_HOUR);
        BigDecimal hourlyRate = pricePerDay.divide(HOURS_PER_DAY, 0, RoundingMode.HALF_UP);
        return hourlyRate.multiply(BigDecimal.valueOf(billableHours));
    }

    private BigDecimal calculateDailyAmount(BigDecimal pricePerDay, long totalMinutes) {
        long fullDays = totalMinutes / MINUTES_PER_DAY;
        long remainingMinutes = totalMinutes % MINUTES_PER_DAY;
        long billableHours = remainingMinutes > 0 ? ceilDiv(remainingMinutes, MINUTES_PER_HOUR) : 0;

        BigDecimal hourlyRate = pricePerDay.divide(HOURS_PER_DAY, 0, RoundingMode.HALF_UP);
        return pricePerDay.multiply(BigDecimal.valueOf(fullDays))
                .add(hourlyRate.multiply(BigDecimal.valueOf(billableHours)));
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
