package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.CarStatus;
import com.rentcity.Rentcity.entity.Transmission;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/** Dữ liệu xe trả ra ngoài (B1/B3/B4). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarResponse {

    private Long id;

    private Long categoryId;
    private String categoryName;
    private Integer seats;

    private Long branchId;
    private String branchName;

    private String licensePlate;
    private String brand;
    private String model;
    private Integer year;
    private Transmission transmission;
    private BigDecimal pricePerDay;
    private BigDecimal deposit;
    private CarStatus status;
    private String description;
    private Double averageRating;
    private Long reviewCount;

    /** Ảnh đại diện (is_primary = true), null nếu xe chưa có ảnh. */
    private String primaryImageUrl;

    /** Toàn bộ ảnh của xe. */
    private List<CarImageResponse> images;
}
