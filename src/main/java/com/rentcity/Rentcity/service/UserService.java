package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.PasswordUpdateRequest;
import com.rentcity.Rentcity.dto.ProfileUpdateRequest;
import com.rentcity.Rentcity.dto.UserResponse;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getCurrentProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return mapToUserResponse(user);
    }

    public UserResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getIdCardUrl() != null) {
            user.setIdCardUrl(request.getIdCardUrl());
        }

        userRepository.save(user);
        return mapToUserResponse(user);
    }

    public void updatePassword(String email, PasswordUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Wrong old password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .idCardUrl(user.getIdCardUrl())
                .role(user.getRole())
                .kycStatus(user.getKycStatus())
                .build();
    }
}
