package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarReviewsResponse {

    private List<PublicReviewResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private long reviewCount;
    private int totalPages;
    private boolean first;
    private boolean last;
    private double averageRating;
    private Map<Integer, Long> ratingCounts;
}
