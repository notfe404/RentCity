package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.CreateDamagePaymentRequest;
import com.rentcity.Rentcity.dto.PaymentResponse;
import com.rentcity.Rentcity.dto.WalletResponse;
import com.rentcity.Rentcity.service.PaymentService;
import com.rentcity.Rentcity.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final PaymentService paymentService;

    @GetMapping("/me")
    public ResponseEntity<WalletResponse> getMyWallet(Authentication authentication) {
        return ResponseEntity.ok(walletService.getMyWallet(authentication.getName()));
    }

    @PostMapping("/bookings/{bookingId}/payments")
    public ResponseEntity<PaymentResponse> createBookingPayment(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody CreateDamagePaymentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createBookingPayment(authentication.getName(), bookingId, request));
    }
}
