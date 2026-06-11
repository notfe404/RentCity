package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardFleetStatusResponse {

    private long totalCars;
    private long availableCars;
    private long maintenanceCars;
    private long retiredCars;
    private long carsWithoutImages;
}
