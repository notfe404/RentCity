package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.DamageAssessmentStatus;
import com.rentcity.Rentcity.entity.DamageSeverity;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class DamageAssessmentResponse {
    private Long id;
    private Long bookingId;
    private String description;
    private DamageSeverity severity;
    private BigDecimal estimatedFee;
    private BigDecimal approvedFee;
    private BigDecimal chargedFee;
    private BigDecimal outstandingFee;
    private DamageAssessmentStatus status;
    private Long assessedBy;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
}
