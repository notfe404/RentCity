package com.rentcity.Rentcity.dto;

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
public class ProfileUpdateRequest {
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Pattern(regexp = "^0\\d{9}$", message = "Phone number must have exactly 10 digits and start with 0")
    private String phone;

    @Size(max = 500, message = "ID card URL must be at most 500 characters")
    private String idCardUrl;
}

