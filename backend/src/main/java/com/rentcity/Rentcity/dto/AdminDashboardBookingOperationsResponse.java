package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardBookingOperationsResponse {

    private long pendingBookings;
    private long confirmedPickupsToday;
    private long ongoingBookings;
    private long returnsToday;
}
