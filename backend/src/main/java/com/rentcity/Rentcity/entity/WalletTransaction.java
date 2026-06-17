package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "wallet_transactions",
        indexes = {
                @Index(name = "idx_wallet_transactions_wallet_created", columnList = "wallet_id, created_at"),
                @Index(name = "idx_wallet_transactions_booking", columnList = "booking_id")
        },
        uniqueConstraints = @UniqueConstraint(name = "uk_wallet_transaction_reference", columnNames = "reference")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "wallet_id", nullable = false)
    private Long walletId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WalletTransactionType type;

    @Column(nullable = false, precision = 14, scale = 0)
    private BigDecimal amount;

    @Column(name = "available_delta", nullable = false, precision = 14, scale = 0)
    private BigDecimal availableDelta;

    @Column(name = "held_delta", nullable = false, precision = 14, scale = 0)
    private BigDecimal heldDelta;

    @Column(name = "available_balance_after", nullable = false, precision = 14, scale = 0)
    private BigDecimal availableBalanceAfter;

    @Column(name = "held_balance_after", nullable = false, precision = 14, scale = 0)
    private BigDecimal heldBalanceAfter;

    @Column(nullable = false, unique = true, length = 100)
    private String reference;

    @Column(length = 255)
    private String description;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
