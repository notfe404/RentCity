package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.WalletTransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WalletTransactionResponse {
    private Long id;
    private Long bookingId;
    private WalletTransactionType type;
    private BigDecimal amount;
    private BigDecimal availableDelta;
    private BigDecimal heldDelta;
    private BigDecimal availableBalanceAfter;
    private BigDecimal heldBalanceAfter;
    private String reference;
    private String description;
    private LocalDateTime createdAt;
}
