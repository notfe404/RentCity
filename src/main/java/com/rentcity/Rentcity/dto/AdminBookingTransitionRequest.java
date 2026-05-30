package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.BookingStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBookingTransitionRequest {

    @NotNull(message = "Target status is required")
    private BookingStatus targetStatus;

    @Size(max = 100, message = "Reason must be at most 100 characters")
    private String reason;

    @Size(max = 500, message = "Note must be at most 500 characters")
    private String note;
}
