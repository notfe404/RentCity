package com.rentcity.Rentcity.dto;

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
public class BookingQuote {

    private BigDecimal baseAmount;
    private BigDecimal depositAmount;
    private BigDecimal totalAmount;
    private LocalDateTime freeCancelUntil;
}
