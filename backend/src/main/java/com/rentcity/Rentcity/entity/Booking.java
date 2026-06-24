package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "bookings",
        indexes = {
                @Index(name = "idx_bookings_user_created_at", columnList = "user_id, created_at"),
                @Index(name = "idx_bookings_car_schedule", columnList = "car_id, status, start_time, end_time"),
                @Index(name = "idx_bookings_payment_expiry", columnList = "status, deposit_status, payment_expires_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", nullable = false, unique = true, length = 32)
    private String bookingCode;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "car_id", nullable = false)
    private Long carId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "pickup_method", nullable = false, length = 30)
    private VehiclePickupMethod pickupMethod = VehiclePickupMethod.BRANCH_PICKUP;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_mode", nullable = false, length = 20)
    private PricingMode pricingMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "deposit_status", nullable = false, length = 20)
    private DepositStatus depositStatus;

    @Column(name = "base_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal baseAmount;

    @Builder.Default
    @Column(name = "insurance_selected", nullable = false)
    private boolean insuranceSelected = false;

    @Builder.Default
    @Column(name = "child_seat_quantity", nullable = false)
    private int childSeatQuantity = 0;

    @Builder.Default
    @Column(name = "gps_selected", nullable = false)
    private boolean gpsSelected = false;

    @Builder.Default
    @Column(name = "extra_services_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal extraServicesAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "delivery_fee_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal deliveryFeeAmount = BigDecimal.ZERO;

    @Column(name = "deposit_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal depositAmount;

    @Builder.Default
    @Column(name = "security_deposit_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal securityDepositAmount = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "security_deposit_status", nullable = false, length = 30)
    private SecurityDepositStatus securityDepositStatus = SecurityDepositStatus.UNPAID;

    @Builder.Default
    @Column(name = "security_deposit_paid_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal securityDepositPaidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_deposit_collection_method", length = 30)
    private SettlementMethod securityDepositCollectionMethod;

    @Column(name = "security_deposit_paid_at")
    private LocalDateTime securityDepositPaidAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_deposit_refund_method", length = 30)
    private SettlementMethod securityDepositRefundMethod;

    @Column(name = "security_deposit_resolved_at")
    private LocalDateTime securityDepositResolvedAt;

    @Builder.Default
    @Column(name = "final_rental_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal finalRentalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "final_payment_status", nullable = false, length = 30)
    private FinalPaymentStatus finalPaymentStatus = FinalPaymentStatus.NOT_DUE;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_payment_method", length = 30)
    private SettlementMethod finalPaymentMethod;

    @Column(name = "final_paid_at")
    private LocalDateTime finalPaidAt;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal totalAmount;

    @Column(name = "free_cancel_until", nullable = false)
    private LocalDateTime freeCancelUntil;

    @Column(name = "payment_expires_at")
    private LocalDateTime paymentExpiresAt;

    @Column(name = "initial_condition_report_id")
    private Long initialConditionReportId;

    @Column(name = "actual_return_at")
    private LocalDateTime actualReturnAt;

    @Column(name = "overdue_minutes")
    private Long overdueMinutes;

    @Builder.Default
    @Column(name = "overdue_fee", precision = 12, scale = 0)
    private BigDecimal overdueFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "penalty_overdue_fee", precision = 12, scale = 0)
    private BigDecimal penaltyOverdueFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_overdue_fee", precision = 12, scale = 0)
    private BigDecimal totalOverdueFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "damage_fee", precision = 12, scale = 0)
    private BigDecimal damageFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "outstanding_amount", precision = 12, scale = 0)
    private BigDecimal outstandingAmount = BigDecimal.ZERO;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancel_reason", length = 100)
    private String cancelReason;

    @Column(name = "cancelled_by", length = 50)
    private String cancelledBy;

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
