package com.rentcity.Rentcity.dto;

import lombok.*;

/** Một ảnh của xe trả ra ngoài. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarImageResponse {
    private Long id;
    private String imageUrl;
    private boolean primary;
}
