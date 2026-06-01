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
    private LocalDateTime cancelledAt;
    private String cancelReason;
    private String cancelledBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
