package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectWithdrawalRequest {
    @NotBlank(message = "Rejection reason is required")
    @Size(max = 500)
    private String reason;
}
