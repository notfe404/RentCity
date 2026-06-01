package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardHotVehicleResponse {

    private Long vehicleId;
    private String vehicleName;
    private String licensePlate;
    private long bookingCount;
}
