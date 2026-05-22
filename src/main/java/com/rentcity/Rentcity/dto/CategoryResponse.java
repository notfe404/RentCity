package com.rentcity.Rentcity.dto;

import lombok.*;

/** Dữ liệu loại xe trả ra ngoài. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private Integer seats;
}
