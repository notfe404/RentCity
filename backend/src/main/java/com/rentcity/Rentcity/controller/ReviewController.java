package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.CreateReviewRequest;
import com.rentcity.Rentcity.dto.CarReviewsResponse;
import com.rentcity.Rentcity.dto.ReviewResponse;
import com.rentcity.Rentcity.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> createReview(
            Authentication authentication,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(authentication.getName(), request));
    }

    @GetMapping("/reviews/my/booking/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> getMyBookingReview(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(reviewService.getMyBookingReview(authentication.getName(), bookingId));
    }

    @GetMapping("/cars/{carId}/reviews")
    public ResponseEntity<CarReviewsResponse> getPublicCarReviews(
            @PathVariable Long carId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return ResponseEntity.ok(reviewService.getPublicCarReviews(carId, page, size));
    }
}
