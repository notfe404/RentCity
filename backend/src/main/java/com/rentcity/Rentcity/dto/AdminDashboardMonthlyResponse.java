package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardMonthlyResponse {

    private String month;
    private long totalBookings;
    private BigDecimal completedRevenue;
    private AdminDashboardHotVehicleResponse hotVehicle;
}
