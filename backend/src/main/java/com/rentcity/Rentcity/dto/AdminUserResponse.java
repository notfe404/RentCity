package com.rentcity.Rentcity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rentcity.Rentcity.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    @JsonProperty("isActive")
    private boolean isActive;
    private LocalDateTime createdAt;
}
