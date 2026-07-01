package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.PricingMode;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class BookingCancellationPolicyService {

    public LocalDateTime calculateFreeCancelUntil(LocalDateTime startTime, PricingMode pricingMode) {
        return startTime.minusHours(24);
    }

    public LocalDateTime calculateFreeCancelUntil(
            LocalDateTime startTime,
            PricingMode pricingMode,
            LocalDateTime bookingCreatedAt
    ) {
        if (bookingCreatedAt != null && Duration.between(bookingCreatedAt, startTime).compareTo(Duration.ofHours(24)) < 0) {
            return bookingCreatedAt;
        }
        return calculateFreeCancelUntil(startTime, pricingMode);
    }

    public boolean isFreeCancellation(Booking booking, LocalDateTime cancelledAt) {
        if (booking.getCreatedAt() != null
                && Duration.between(booking.getCreatedAt(), booking.getStartTime()).compareTo(Duration.ofHours(24)) < 0) {
            return false;
        }
        return booking.getFreeCancelUntil() != null && !cancelledAt.isAfter(booking.getFreeCancelUntil());
    }

    public DepositStatus determineDepositStatusAfterCustomerCancel(Booking booking, LocalDateTime cancelledAt) {
        DepositStatus currentStatus = booking.getDepositStatus();
        if (currentStatus == null) {
            return DepositStatus.UNPAID;
        }

        if (currentStatus == DepositStatus.UNPAID || currentStatus == DepositStatus.NOT_REQUIRED) {
            return currentStatus;
        }

        boolean freeCancellation = isFreeCancellation(booking, cancelledAt);
        if (currentStatus == DepositStatus.PAID) {
            return freeCancellation ? DepositStatus.REFUNDED : DepositStatus.FORFEITED;
        }

        return currentStatus;
    }
}
