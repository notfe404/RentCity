package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.Payment;
import com.rentcity.Rentcity.entity.PaymentGateway;
import com.rentcity.Rentcity.entity.PaymentStatus;
import com.rentcity.Rentcity.entity.PaymentType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);

    Optional<Payment> findByGatewayReference(String gatewayReference);

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    Optional<Payment> findFirstByBookingIdAndTypeAndStatusOrderByCreatedAtDesc(
            Long bookingId,
            PaymentType type,
            PaymentStatus status
    );

    Optional<Payment> findFirstByBookingIdAndGatewayAndTypeAndStatusOrderByCreatedAtDesc(
            Long bookingId,
            PaymentGateway gateway,
            PaymentType type,
            PaymentStatus status
    );

    Optional<Payment> findFirstByBookingIdAndGatewayAndTypeAndStatusInOrderByCreatedAtDesc(
            Long bookingId,
            PaymentGateway gateway,
            PaymentType type,
            Collection<PaymentStatus> statuses
    );

    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Payment> findAllByOrderByCreatedAtDesc();

    long countByStatus(PaymentStatus status);
}
