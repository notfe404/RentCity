package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.CreateWithdrawalRequest;
import com.rentcity.Rentcity.dto.WithdrawalRequestResponse;
import com.rentcity.Rentcity.service.WithdrawalRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/wallet/withdrawals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class WithdrawalRequestController {

    private final WithdrawalRequestService withdrawalRequestService;

    @PostMapping
    public ResponseEntity<WithdrawalRequestResponse> create(
            Authentication authentication,
            @Valid @RequestBody CreateWithdrawalRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(withdrawalRequestService.create(authentication.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<WithdrawalRequestResponse>> getMine(Authentication authentication) {
        return ResponseEntity.ok(withdrawalRequestService.getMine(authentication.getName()));
    }
}
