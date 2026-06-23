package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.PricingMode;
import com.rentcity.Rentcity.entity.VehiclePickupMethod;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "Vehicle id is required")
    private Long vehicleId;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotNull(message = "Pricing mode is required")
    private PricingMode pricingMode;

    @Builder.Default
    @NotNull(message = "Pickup method is required")
    private VehiclePickupMethod pickupMethod = VehiclePickupMethod.BRANCH_PICKUP;

    @Size(max = 500, message = "Delivery address must not exceed 500 characters")
    private String deliveryAddress;
}
