package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.PricingMode;
import com.rentcity.Rentcity.entity.VehiclePickupMethod;
import com.rentcity.Rentcity.entity.FinalPaymentStatus;
import com.rentcity.Rentcity.entity.SecurityDepositStatus;
import com.rentcity.Rentcity.entity.SettlementMethod;
import com.rentcity.Rentcity.entity.PaymentGateway;
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
public class BookingResponse {

    private Long id;
    private String bookingCode;
    private Long vehicleId;
    private Long userId;
    private String vehicleName;
    private String vehicleLicensePlate;
    private String vehiclePrimaryImageUrl;
    private BigDecimal vehiclePricePerDay;
    private String customerName;
    private String customerEmail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private VehiclePickupMethod pickupMethod;
    private String deliveryAddress;
    private PricingMode pricingMode;
    private BookingStatus status;
    private DepositStatus depositStatus;
    private BigDecimal baseAmount;
    private boolean insuranceSelected;
    private int childSeatQuantity;
    private boolean gpsSelected;
    private BigDecimal extraServicesAmount;
    private BigDecimal deliveryFeeAmount;
    private BigDecimal depositAmount;
    private DepositStatus reservationFeeStatus;
    private BigDecimal reservationFeeAmount;
    private BigDecimal securityDepositAmount;
    private SecurityDepositStatus securityDepositStatus;
    private BigDecimal securityDepositPaidAmount;
    private SettlementMethod securityDepositCollectionMethod;
    private PaymentGateway securityDepositGateway;
    private LocalDateTime securityDepositPaidAt;
    private SettlementMethod securityDepositRefundMethod;
    private LocalDateTime securityDepositResolvedAt;
    private BigDecimal securityDepositRepairCost;
    private BigDecimal securityDepositRefundedAmount;
    private BigDecimal finalRentalAmount;
    private FinalPaymentStatus finalPaymentStatus;
    private SettlementMethod finalPaymentMethod;
    private PaymentGateway finalPaymentGateway;
    private LocalDateTime finalPaidAt;
    private BigDecimal totalAmount;
    private LocalDateTime freeCancelUntil;
    private LocalDateTime paymentExpiresAt;
    private LocalDateTime actualReturnAt;
    private Long overdueMinutes;
    private BigDecimal overdueFee;
    private BigDecimal penaltyOverdueFee;
    private BigDecimal totalOverdueFee;
    private BigDecimal damageFee;
    private BigDecimal outstandingAmount;
    private DamageAssessmentResponse damageAssessment;
    private LocalDateTime cancelledAt;
    private String cancelReason;
    private String cancelledBy;
    private CarConditionResponse initialCondition;
    private CarConditionResponse returnCondition;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
