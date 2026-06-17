package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.AdminBookingTransitionRequest;
import com.rentcity.Rentcity.dto.BookingResponse;
import com.rentcity.Rentcity.dto.CarConditionRequest;
import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.dto.DamageAssessmentResponse;
import com.rentcity.Rentcity.dto.FinalizeDamageAssessmentRequest;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.service.BookingService;
import com.rentcity.Rentcity.service.CarConditionService;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminBookingController {

    private final BookingService bookingService;
    private final CarConditionService carConditionService;
    private final com.rentcity.Rentcity.service.DamageAssessmentService damageAssessmentService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<BookingResponse> getAdminBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getAdminBooking(id));
    }

    @PostMapping("/{id}/transition")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<BookingResponse> transitionBooking(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AdminBookingTransitionRequest request
    ) {
        return ResponseEntity.ok(bookingService.transitionBookingAsAdmin(authentication.getName(), id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<BookingResponse> cancelBooking(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.cancelBookingAsAdmin(authentication.getName(), id));
    }

    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<BookingResponse> requestCheckIn(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.requestCheckIn(id, authentication.getName()));
    }

    @GetMapping("/{id}/conditions")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<CarConditionResponse>> getBookingConditions(@PathVariable Long id) {
        bookingService.getAdminBooking(id);
        return ResponseEntity.ok(carConditionService.getBookingReports(id));
    }

    @PostMapping(value = "/{id}/return-condition", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_STAFF')")
    public ResponseEntity<BookingResponse> completeReturnInspection(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestPart("condition") CarConditionRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        return ResponseEntity.ok(
                bookingService.completeReturnInspection(authentication.getName(), id, request, files)
        );
    }

    @PostMapping(value = "/{id}/return-condition/images", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_STAFF')")
    public ResponseEntity<CarConditionResponse> uploadReturnConditionImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files
    ) {
        bookingService.getAdminBooking(id);
        return ResponseEntity.ok(carConditionService.uploadReturnImages(id, files));
    }

    @GetMapping("/{id}/damage-assessment")
    public ResponseEntity<DamageAssessmentResponse> getDamageAssessment(@PathVariable Long id) {
        bookingService.getAdminBooking(id);
        return ResponseEntity.ok(damageAssessmentService.getByBooking(id));
    }

    @PostMapping("/{id}/damage-assessment/finalize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DamageAssessmentResponse> finalizeDamageAssessment(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody FinalizeDamageAssessmentRequest request
    ) {
        User admin = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(damageAssessmentService.finalizeAssessment(id, request.getActualFee(), admin.getId()));
    }
}
