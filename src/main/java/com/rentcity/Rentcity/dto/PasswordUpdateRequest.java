package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PasswordUpdateRequest {
    @NotBlank(message = "Mật khẩu cũ không được để trống")
    private String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$",
        message = "Mật khẩu mới phải từ 8 ký tự, chỉ chứa chữ và số, có cả chữ hoa và chữ thường, không chứa ký tự đặc biệt"
    )
    private String newPassword;
}
