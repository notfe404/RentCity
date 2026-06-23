package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.SettlementMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SecurityDepositCollectionRequest {
    @NotNull
    private SettlementMethod method;
}
