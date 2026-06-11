package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicReviewResponse {

    private Long id;
    private String customerName;
    private Integer overallRating;
    private Integer vehicleRating;
    private Integer serviceRating;
    private String comment;
    private String staffReply;
    private String repliedByName;
    private LocalDateTime createdAt;
}
