package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardOverviewResponse {

    private AdminDashboardBookingOperationsResponse bookingOperations;
    private AdminDashboardFleetStatusResponse fleetStatus;
    private AdminDashboardPaymentStatusResponse paymentStatus;
    private long totalBookingsLast12Months;
    private long cancelledBookingsLast12Months;
    private double cancellationRate;
    private long pendingKycUsers;
    private List<AdminDashboardRecentBookingResponse> recentBookings;
}
