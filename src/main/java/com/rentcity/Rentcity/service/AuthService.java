package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.AuthResponse;
import com.rentcity.Rentcity.dto.LoginRequest;
import com.rentcity.Rentcity.dto.RefreshTokenRequest;
import com.rentcity.Rentcity.dto.RegisterRequest;
import com.rentcity.Rentcity.dto.UserResponse;
import com.rentcity.Rentcity.entity.KycStatus;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.entity.TokenBlacklist;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.repository.TokenBlacklistRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import com.rentcity.Rentcity.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email này đã được sử dụng");
        }
        
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại này đã được sử dụng");
        }

        var user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.CUSTOMER)
                .kycStatus(KycStatus.PENDING)
                .build();

        userRepository.save(user);

        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .user(mapToUserResponse(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .user(mapToUserResponse(user))
                .build();
    }

    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        if (token != null && !tokenBlacklistRepository.existsByToken(token)) {
            TokenBlacklist tokenBlacklist = TokenBlacklist.builder()
                    .token(token)
                    .build();
            tokenBlacklistRepository.save(tokenBlacklist);
        }
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String username = jwtService.extractUsername(refreshToken);
        if (username != null) {
            var user = userRepository.findByEmail(username).orElseThrow();
            if (jwtService.isTokenValid(refreshToken, user)) {
                var accessToken = jwtService.generateToken(user);
                return AuthResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .user(mapToUserResponse(user))
                        .build();
            }
        }
        throw new IllegalArgumentException("Invalid refresh token");
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
