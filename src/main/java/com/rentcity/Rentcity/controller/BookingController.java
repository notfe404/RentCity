package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.BookingResponse;
import com.rentcity.Rentcity.dto.CreateBookingRequest;
import com.rentcity.Rentcity.service.BookingService;
import com.rentcity.Rentcity.service.BookingTestConfirmationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingTestConfirmationService bookingTestConfirmationService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            Authentication authentication,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(authentication.getName(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getMyBooking(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.getMyBooking(authentication.getName(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.cancelBooking(authentication.getName(), id));
    }

    @PostMapping("/{id}/confirm-for-test")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<BookingResponse> confirmForTest(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingTestConfirmationService.confirmForTest(id, authentication.getName()));
    }
}
