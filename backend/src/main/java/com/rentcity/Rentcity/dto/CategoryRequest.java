package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/** Dữ liệu vào khi tạo/sửa loại xe. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "Tên loại xe không được để trống")
    @Size(max = 50, message = "Tên loại xe tối đa 50 ký tự")
    private String name;

    @NotNull(message = "Số chỗ ngồi không được để trống")
    @Min(value = 1, message = "Số chỗ ngồi phải lớn hơn 0")
    private Integer seats;

    private String description;

    @PositiveOrZero(message = "Giá thuê cơ bản không được âm")
    private BigDecimal basePriceDay;

    @DecimalMin(value = "0.0", message = "Tỷ lệ cọc phải >= 0")
    @DecimalMax(value = "1.0", message = "Tỷ lệ cọc phải <= 1")
    private BigDecimal depositRate;

    @Builder.Default
    private boolean isActive = true;
}
