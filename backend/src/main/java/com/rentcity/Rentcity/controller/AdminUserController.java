package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.AdminUserResponse;
import com.rentcity.Rentcity.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getUsers() {
        return ResponseEntity.ok(userService.getAdminUsers());
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<AdminUserResponse> toggleUserStatus(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(userService.toggleUserStatus(authentication.getName(), id));
    }
}
