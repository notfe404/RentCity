package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.PaymentGateway;
import com.rentcity.Rentcity.entity.PaymentStatus;
import com.rentcity.Rentcity.entity.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private Long bookingId;
    private String bookingCode;
    private Long userId;
    private PaymentType type;
    private PaymentGateway gateway;
    private PaymentStatus status;
    private BigDecimal amount;
    private String currency;
    private String gatewayReference;
    private String gatewayTransactionId;
    private String paymentUrl;
    private String failureReason;
    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
