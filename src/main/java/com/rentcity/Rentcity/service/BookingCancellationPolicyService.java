package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.PricingMode;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class BookingCancellationPolicyService {

    public LocalDateTime calculateFreeCancelUntil(LocalDateTime startTime, PricingMode pricingMode) {
        return pricingMode == PricingMode.HOURLY
                ? startTime.minusHours(1)
                : startTime.minusDays(1);
    }

    public DepositStatus determineDepositStatusAfterCustomerCancel(Booking booking, LocalDateTime cancelledAt) {
        DepositStatus currentStatus = booking.getDepositStatus();
        if (currentStatus == null) {
            return DepositStatus.UNPAID;
        }

        if (currentStatus == DepositStatus.UNPAID || currentStatus == DepositStatus.NOT_REQUIRED) {
            return currentStatus;
        }

        boolean freeCancellation = !cancelledAt.isAfter(booking.getFreeCancelUntil());
        if (currentStatus == DepositStatus.PAID) {
            return freeCancellation ? DepositStatus.REFUNDED : DepositStatus.FORFEITED;
        }

        return currentStatus;
    }
}
