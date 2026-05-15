package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "token_blacklist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenBlacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 512)
    private String token;

    @Column(name = "blacklisted_at")
    private LocalDateTime blacklistedAt;

    @PrePersist
    protected void onCreate() {
        blacklistedAt = LocalDateTime.now();
    }
}
