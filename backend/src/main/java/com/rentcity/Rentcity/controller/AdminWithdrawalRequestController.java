package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.RejectWithdrawalRequest;
import com.rentcity.Rentcity.dto.WithdrawalRequestResponse;
import com.rentcity.Rentcity.entity.WithdrawalRequestStatus;
import com.rentcity.Rentcity.service.WithdrawalRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/withdrawals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminWithdrawalRequestController {

    private final WithdrawalRequestService withdrawalRequestService;

    @GetMapping
    public ResponseEntity<List<WithdrawalRequestResponse>> getAll(
            @RequestParam(required = false) WithdrawalRequestStatus status
    ) {
        return ResponseEntity.ok(withdrawalRequestService.getAll(status));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<WithdrawalRequestResponse> complete(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(withdrawalRequestService.complete(authentication.getName(), id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<WithdrawalRequestResponse> reject(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody RejectWithdrawalRequest request
    ) {
        return ResponseEntity.ok(
                withdrawalRequestService.reject(authentication.getName(), id, request.getReason())
        );
    }
}
