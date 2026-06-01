package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.AdminDashboardMonthlyResponse;
import com.rentcity.Rentcity.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/monthly")
    public ResponseEntity<List<AdminDashboardMonthlyResponse>> getMonthlyDashboard() {
        return ResponseEntity.ok(adminDashboardService.getMonthlyDashboard());
    }
}
