package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewVisibilityRequest {

    @NotNull(message = "Visibility is required")
    private Boolean visible;
}
