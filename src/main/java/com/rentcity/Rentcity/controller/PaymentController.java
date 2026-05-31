package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.CapturePaymentRequest;
import com.rentcity.Rentcity.dto.CreatePaymentRequest;
import com.rentcity.Rentcity.dto.PaymentResponse;
import com.rentcity.Rentcity.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/deposit")
    public ResponseEntity<PaymentResponse> createDepositPayment(
            Authentication authentication,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createDepositPayment(authentication.getName(), request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(Authentication authentication) {
        return ResponseEntity.ok(paymentService.getMyPayments(authentication.getName()));
    }

    @PostMapping("/paypal/{id}/capture")
    public ResponseEntity<PaymentResponse> capturePaypalPayment(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) CapturePaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.capturePaypalPayment(authentication.getName(), id, request));
    }

    @GetMapping("/vnpay/callback")
    public ResponseEntity<PaymentResponse> handleVnpayCallback(
            @RequestParam String reference,
            @RequestParam(name = "vnp_ResponseCode", defaultValue = "00") String responseCode,
            @RequestParam(name = "vnp_TransactionNo", required = false) String transactionNo
    ) {
        return ResponseEntity.ok(paymentService.handleVnpayCallback(reference, responseCode, transactionNo));
    }

    @PostMapping("/{id}/mock-success")
    public ResponseEntity<PaymentResponse> mockPaymentSuccess(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(paymentService.mockPaymentSuccess(authentication.getName(), id));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(paymentService.refundPayment(authentication.getName(), id));
    }
}
