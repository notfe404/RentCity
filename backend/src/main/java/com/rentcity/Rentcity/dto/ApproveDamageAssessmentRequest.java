package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApproveDamageAssessmentRequest {
    @NotNull
    @PositiveOrZero
    private BigDecimal approvedFee;
}
