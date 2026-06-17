package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.DamageAssessment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DamageAssessmentRepository extends JpaRepository<DamageAssessment, Long> {
    Optional<DamageAssessment> findByBookingId(Long bookingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from DamageAssessment d where d.bookingId = :bookingId")
    Optional<DamageAssessment> findByBookingIdForUpdate(@Param("bookingId") Long bookingId);
}
