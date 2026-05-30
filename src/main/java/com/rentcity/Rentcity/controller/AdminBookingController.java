package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.AdminBookingTransitionRequest;
import com.rentcity.Rentcity.dto.BookingResponse;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminBookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAdminBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ResponseEntity.ok(bookingService.getAdminBookings(status, vehicleId, userId, from, to));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getAdminBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getAdminBooking(id));
    }

    @PostMapping("/{id}/transition")
    public ResponseEntity<BookingResponse> transitionBooking(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AdminBookingTransitionRequest request
    ) {
        return ResponseEntity.ok(bookingService.transitionBookingAsAdmin(authentication.getName(), id, request));
    }
}
