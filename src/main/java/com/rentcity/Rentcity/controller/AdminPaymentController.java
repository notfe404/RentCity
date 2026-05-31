package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.PaymentResponse;
import com.rentcity.Rentcity.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getPayments() {
        return ResponseEntity.ok(paymentService.getAdminPayments());
    }

    @PostMapping("/{id}/confirm-cash")
    public ResponseEntity<PaymentResponse> confirmCashPayment(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(paymentService.confirmCashPayment(id, authentication.getName()));
    }

    @PostMapping("/bookings/{bookingId}/confirm-cash")
    public ResponseEntity<PaymentResponse> confirmCashPaymentByBooking(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(paymentService.confirmCashPaymentByBooking(bookingId, authentication.getName()));
    }
}
