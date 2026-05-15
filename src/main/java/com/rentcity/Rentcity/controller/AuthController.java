package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.AuthResponse;
import com.rentcity.Rentcity.dto.LoginRequest;
import com.rentcity.Rentcity.dto.RegisterRequest;
import com.rentcity.Rentcity.dto.RefreshTokenRequest;
import com.rentcity.Rentcity.dto.UserResponse;
import com.rentcity.Rentcity.service.AuthService;
import com.rentcity.Rentcity.service.UserService;
import org.springframework.security.core.Authentication;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        authService.logout(authHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentProfile(email));
    }
}
