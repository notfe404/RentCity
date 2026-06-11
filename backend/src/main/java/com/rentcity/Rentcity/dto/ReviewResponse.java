package com.rentcity.Rentcity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private Long bookingId;
    private String bookingCode;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleLicensePlate;
    private Integer overallRating;
    private Integer vehicleRating;
    private Integer serviceRating;
    private String comment;
    @JsonProperty("isVisible")
    private boolean isVisible;
    private String staffReply;
    private Long repliedBy;
    private String repliedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
