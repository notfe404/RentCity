package com.rentcity.Rentcity.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class WalletResponse {
    private Long id;
    private BigDecimal availableBalance;
    private BigDecimal heldBalance;
    private BigDecimal totalBalance;
    private String currency;
    private List<WalletTransactionResponse> transactions;
}
