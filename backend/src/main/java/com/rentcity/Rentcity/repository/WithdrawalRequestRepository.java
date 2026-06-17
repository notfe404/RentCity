package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.WithdrawalRequest;
import com.rentcity.Rentcity.entity.WithdrawalRequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<WithdrawalRequest> findAllByOrderByCreatedAtDesc();
    List<WithdrawalRequest> findByStatusOrderByCreatedAtDesc(WithdrawalRequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from WithdrawalRequest request where request.id = :id")
    Optional<WithdrawalRequest> findByIdForUpdate(@Param("id") Long id);
}
