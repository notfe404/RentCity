package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.PricingMode;
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
    private PricingMode pricingMode;
    private BookingStatus status;
    private DepositStatus depositStatus;
    private BigDecimal baseAmount;
    private BigDecimal depositAmount;
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
