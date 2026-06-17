package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.WithdrawalRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WithdrawalRequestResponse {
    private Long id;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private BigDecimal amount;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private WithdrawalRequestStatus status;
    private String rejectionReason;
    private Long processedBy;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
