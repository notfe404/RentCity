package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.CarStatus;
import com.rentcity.Rentcity.entity.FuelType;
import com.rentcity.Rentcity.entity.Transmission;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/** Dữ liệu vào khi tạo/sửa xe (B1). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarRequest {

    /** ID loại xe — tùy chọn, nếu có thì phải tồn tại. */
    private Long categoryId;

    /** ID chi nhánh — tùy chọn, nếu có thì phải tồn tại. */
    private Long branchId;

    @NotBlank(message = "Biển số xe không được để trống")
    @Size(max = 20, message = "Biển số xe tối đa 20 ký tự")
    private String licensePlate;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(max = 50, message = "Hãng xe tối đa 50 ký tự")
    private String brand;

    @NotBlank(message = "Tên dòng xe không được để trống")
    @Size(max = 50, message = "Tên dòng xe tối đa 50 ký tự")
    private String model;

    @NotNull(message = "Năm sản xuất không được để trống")
    @Min(value = 1900, message = "Năm sản xuất không hợp lệ")
    @Max(value = 2100, message = "Năm sản xuất không hợp lệ")
    private Integer year;

    @NotNull(message = "Hộp số không được để trống (AUTO hoặc MANUAL)")
    private Transmission transmission;

    @NotNull(message = "Fuel type is required")
    private FuelType fuelType;

    @NotNull(message = "Giá thuê / ngày không được để trống")
    @Positive(message = "Giá thuê / ngày phải lớn hơn 0")
    private BigDecimal pricePerDay;

    @NotNull(message = "Tiền cọc thuê xe không được để trống")
    @Positive(message = "Tiền cọc thuê xe phải lớn hơn 0")
    private BigDecimal deposit;

    /** Trạng thái xe — tùy chọn, mặc định AVAILABLE khi tạo mới. */
    private CarStatus status;

    @Min(value = 1, message = "Số chỗ ngồi phải lớn hơn 0")
    private Integer seats;

    private String description;

    @Valid
    private CarConditionRequest initialCondition;
}
