package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.CarCondition;
import com.rentcity.Rentcity.entity.DamageSeverity;
import com.rentcity.Rentcity.entity.SettlementMethod;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ReturnContractRequest {
    @NotNull
    private LocalDateTime actualReturnAt;

    @NotNull
    private CarCondition condition;

    private boolean damageFound;
    private DamageSeverity damageSeverity;

    @PositiveOrZero
    private BigDecimal estimatedDamageFee;

    @Size(max = 2000)
    private String damageDescription;

    @Size(max = 2000)
    private String notes;

    @NotNull
    @Min(0)
    @Max(10)
    private Integer keyCount;

    @Size(max = 1000)
    private String accessories;

    @NotNull
    private SettlementMethod finalPaymentMethod;

    private SettlementMethod securityDepositRefundMethod;
}
