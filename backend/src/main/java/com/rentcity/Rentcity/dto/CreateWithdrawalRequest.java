package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateWithdrawalRequest {
    @NotNull(message = "Withdrawal amount is required")
    @DecimalMin(value = "1", message = "Withdrawal amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Bank name is required")
    @Size(max = 100)
    private String bankName;

    @NotBlank(message = "Account number is required")
    @Size(max = 50)
    private String accountNumber;

    @NotBlank(message = "Account holder name is required")
    @Size(max = 100)
    private String accountHolderName;
}
