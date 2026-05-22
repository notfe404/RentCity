package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "doc_type", nullable = false, length = 50)
    private String docType;

    @Column(name = "doc_number", length = 50)
    private String docNumber;

    @Column(name = "front_url")
    private String frontUrl;

    @Column(name = "back_url")
    private String backUrl;

    @Column(nullable = false)
    private boolean verified;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

