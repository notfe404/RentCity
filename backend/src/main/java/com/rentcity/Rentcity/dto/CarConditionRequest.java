package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.CarCondition;
import com.rentcity.Rentcity.entity.DamageSeverity;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarConditionRequest {

    @NotNull(message = "Car condition is required")
    private CarCondition condition;

    private LocalDateTime actualReturnAt;

    private boolean damageFound;

    private DamageSeverity damageSeverity;

    @PositiveOrZero(message = "Estimated damage fee cannot be negative")
    private BigDecimal estimatedDamageFee;

    @Size(max = 2000, message = "Damage description must be at most 2000 characters")
    private String damageDescription;

    @Size(max = 2000, message = "Condition notes must be at most 2000 characters")
    private String notes;
}
