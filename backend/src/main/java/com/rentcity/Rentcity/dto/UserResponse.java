package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.KycStatus;
import com.rentcity.Rentcity.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String idCardUrl;
    private Role role;
    private KycStatus kycStatus;
}
