package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_reviews_booking_id", columnNames = "booking_id")
        },
        indexes = {
                @Index(name = "idx_reviews_car_visible_created", columnList = "car_id, is_visible, created_at"),
                @Index(name = "idx_reviews_user_created", columnList = "user_id, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "car_id", nullable = false)
    private Long carId;

    @Column(name = "overall_rating", nullable = false)
    private Integer overallRating;

    @Column(name = "vehicle_rating", nullable = false)
    private Integer vehicleRating;

    @Column(name = "service_rating", nullable = false)
    private Integer serviceRating;

    @Column(length = 500)
    private String comment;

    @Column(name = "is_visible", nullable = false)
    private boolean isVisible;

    @Column(name = "staff_reply", length = 500)
    private String staffReply;

    @Column(name = "replied_by")
    private Long repliedBy;

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
