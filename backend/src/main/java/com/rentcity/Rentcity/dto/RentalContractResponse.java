package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.RentalContractStatus;
import com.rentcity.Rentcity.entity.FinalPaymentStatus;
import com.rentcity.Rentcity.entity.SecurityDepositStatus;
import com.rentcity.Rentcity.entity.SettlementMethod;
import com.rentcity.Rentcity.entity.PaymentGateway;
import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalContractResponse {
    private Long id;
    private Long bookingId;
    private String contractNumber;
    private String policyVersion;
    private String policyText;
    private RentalContractStatus status;
    private LocalDateTime handoverAt;
    private Integer handoverKeyCount;
    private String handoverAccessories;
    private String handoverCustomerSignature;
    private LocalDateTime handoverCustomerSignedAt;
    private String handoverStaffSignature;
    private Long handoverStaffUserId;
    private LocalDateTime handoverStaffSignedAt;
    private BigDecimal securityDepositAmount;
    private SettlementMethod securityDepositCollectionMethod;
    private PaymentGateway securityDepositGateway;
    private LocalDateTime securityDepositPaidAt;
    private CarConditionResponse handoverCondition;
    private Integer returnKeyCount;
    private String returnAccessories;
    private String returnCustomerSignature;
    private LocalDateTime returnCustomerSignedAt;
    private String returnStaffSignature;
    private Long returnStaffUserId;
    private LocalDateTime returnStaffSignedAt;
    private CarConditionResponse returnCondition;
    private SecurityDepositStatus securityDepositStatus;
    private SettlementMethod securityDepositRefundMethod;
    private LocalDateTime securityDepositResolvedAt;
    private BigDecimal securityDepositRepairCost;
    private BigDecimal securityDepositRefundedAmount;
    private BigDecimal finalRentalAmount;
    private SettlementMethod finalPaymentMethod;
    private FinalPaymentStatus finalPaymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
