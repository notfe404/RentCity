package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardPaymentStatusResponse {

    private long pendingPayments;
    private long paidPayments;
    private long failedPayments;
    private long refundedPayments;
    private long expiredPayments;
}
