package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.SettlementMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ResolveRetainedSecurityDepositRequest {

    @NotNull(message = "Actual repair cost is required")
    @PositiveOrZero(message = "Actual repair cost cannot be negative")
    private BigDecimal actualRepairCost;

    private SettlementMethod refundMethod;
}
