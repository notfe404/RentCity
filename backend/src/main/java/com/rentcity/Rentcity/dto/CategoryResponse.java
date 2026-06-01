package com.rentcity.Rentcity.dto;

import lombok.*;

import java.math.BigDecimal;

/** Dữ liệu loại xe trả ra ngoài. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private Integer seats;
    private String description;
    private BigDecimal basePriceDay;
    private BigDecimal depositRate;
    private boolean isActive;
}
