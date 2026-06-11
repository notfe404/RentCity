package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.DepositStatus;
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
public class AdminDashboardRecentBookingResponse {

    private Long id;
    private String bookingCode;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleLicensePlate;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private BookingStatus status;
    private DepositStatus depositStatus;
    private BigDecimal totalAmount;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
}
