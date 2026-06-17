package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.WalletTransaction;
import com.rentcity.Rentcity.entity.WalletTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);
    boolean existsByReference(String reference);
    boolean existsByBookingIdAndType(Long bookingId, WalletTransactionType type);
}
