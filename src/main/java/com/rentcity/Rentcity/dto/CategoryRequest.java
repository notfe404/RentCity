package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

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
}
