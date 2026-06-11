package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.AdminReviewReplyRequest;
import com.rentcity.Rentcity.dto.AdminReviewVisibilityRequest;
import com.rentcity.Rentcity.dto.ReviewResponse;
import com.rentcity.Rentcity.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getReviews() {
        return ResponseEntity.ok(reviewService.getAdminReviews());
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<ReviewResponse> updateVisibility(
            @PathVariable Long id,
            @Valid @RequestBody AdminReviewVisibilityRequest request
    ) {
        return ResponseEntity.ok(reviewService.updateVisibility(id, request));
    }

    @PatchMapping("/{id}/reply")
    public ResponseEntity<ReviewResponse> replyToReview(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AdminReviewReplyRequest request
    ) {
        return ResponseEntity.ok(reviewService.replyToReview(authentication.getName(), id, request));
    }
}
