package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "rental_contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false, unique = true)
    private Long bookingId;

    @Column(name = "contract_number", nullable = false, unique = true, length = 40)
    private String contractNumber;

    @Column(name = "policy_version", nullable = false, length = 20)
    private String policyVersion;

    @Column(name = "policy_text", nullable = false, columnDefinition = "TEXT")
    private String policyText;

    @Column(name = "handover_condition_report_id")
    private Long handoverConditionReportId;

    @Column(name = "handover_at")
    private LocalDateTime handoverAt;

    @Column(name = "handover_key_count")
    private Integer handoverKeyCount;

    @Column(name = "handover_accessories", length = 1000)
    private String handoverAccessories;

    @Column(name = "handover_customer_signature", length = 500)
    private String handoverCustomerSignature;

    @Column(name = "handover_customer_signed_at")
    private LocalDateTime handoverCustomerSignedAt;

    @Column(name = "handover_staff_signature", length = 500)
    private String handoverStaffSignature;

    @Column(name = "handover_staff_user_id")
    private Long handoverStaffUserId;

    @Column(name = "handover_staff_signed_at")
    private LocalDateTime handoverStaffSignedAt;

    @Column(name = "security_deposit_amount", precision = 12, scale = 0)
    private BigDecimal securityDepositAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_deposit_collection_method", length = 30)
    private SettlementMethod securityDepositCollectionMethod;

    @Column(name = "security_deposit_paid_at")
    private LocalDateTime securityDepositPaidAt;

    @Column(name = "return_condition_report_id")
    private Long returnConditionReportId;

    @Column(name = "return_key_count")
    private Integer returnKeyCount;

    @Column(name = "return_accessories", length = 1000)
    private String returnAccessories;

    @Column(name = "return_customer_signature", length = 500)
    private String returnCustomerSignature;

    @Column(name = "return_customer_signed_at")
    private LocalDateTime returnCustomerSignedAt;

    @Column(name = "return_staff_signature", length = 500)
    private String returnStaffSignature;

    @Column(name = "return_staff_user_id")
    private Long returnStaffUserId;

    @Column(name = "return_staff_signed_at")
    private LocalDateTime returnStaffSignedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_deposit_status", length = 30)
    private SecurityDepositStatus securityDepositStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_deposit_refund_method", length = 30)
    private SettlementMethod securityDepositRefundMethod;

    @Column(name = "security_deposit_resolved_at")
    private LocalDateTime securityDepositResolvedAt;

    @Column(name = "final_rental_amount", precision = 12, scale = 0)
    private BigDecimal finalRentalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_payment_method", length = 30)
    private SettlementMethod finalPaymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_payment_status", length = 30)
    private FinalPaymentStatus finalPaymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RentalContractStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
