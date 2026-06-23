package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.CarCondition;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HandoverContractRequest {
    @NotNull
    private LocalDateTime actualHandoverAt;

    @NotNull
    private CarCondition condition;

    @NotNull
    @PositiveOrZero
    private Long odometer;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer fuelLevel;

    private boolean damageFound;

    @Size(max = 2000)
    private String notes;

    @NotNull
    @Min(0)
    @Max(10)
    private Integer keyCount;

    @Size(max = 1000)
    private String accessories;
}

