package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.PasswordUpdateRequest;
import com.rentcity.Rentcity.dto.ProfileUpdateRequest;
import com.rentcity.Rentcity.dto.UserResponse;
import com.rentcity.Rentcity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentProfile(email));
    }

    @PutMapping("/update")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @RequestBody ProfileUpdateRequest request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> updatePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordUpdateRequest request
    ) {
        String email = authentication.getName();
        userService.updatePassword(email, request);
        return ResponseEntity.ok().build();
    }
}
