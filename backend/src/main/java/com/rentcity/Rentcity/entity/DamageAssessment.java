package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "damage_assessments",
        uniqueConstraints = @UniqueConstraint(name = "uk_damage_assessment_booking", columnNames = "booking_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DamageAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DamageSeverity severity;

    @Column(name = "estimated_fee", nullable = false, precision = 12, scale = 0)
    private BigDecimal estimatedFee;

    @Builder.Default
    @Column(name = "approved_fee", nullable = false, precision = 12, scale = 0)
    private BigDecimal approvedFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "charged_fee", nullable = false, precision = 12, scale = 0)
    private BigDecimal chargedFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "outstanding_fee", nullable = false, precision = 12, scale = 0)
    private BigDecimal outstandingFee = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DamageAssessmentStatus status;

    @Column(name = "assessed_by", nullable = false)
    private Long assessedBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
