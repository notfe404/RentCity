package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.PaymentGateway;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateWalletTopUpRequest {
    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private PaymentGateway gateway;

    private String idempotencyKey;
}
