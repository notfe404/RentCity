package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.PaymentGateway;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateDamagePaymentRequest {
    @NotNull
    private PaymentGateway gateway;

    private String idempotencyKey;
}
