package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FinalizeDamageAssessmentRequest {
    @NotNull(message = "Actual repair fee is required")
    @Min(value = 0, message = "Actual fee must be positive")
    private BigDecimal actualFee;
}
