package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.SecurityDepositStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    @Query("""
            select (count(b) > 0)
            from Booking b
            where b.carId = :carId
              and b.status in :statuses
              and :startTime < b.endTime
              and :endTime > b.startTime
            """)
    boolean existsOverlappingBooking(
            @Param("carId") Long carId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    @Query("""
            select distinct b.carId
            from Booking b
            where b.status in :statuses
              and :startTime < b.endTime
              and :endTime > b.startTime
            """)
    List<Long> findOverlappingCarIds(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    java.util.Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select b
            from Booking b
            where b.status = :status
              and b.depositStatus = :depositStatus
              and (
                    b.paymentExpiresAt <= :now
                    or (b.paymentExpiresAt is null and b.createdAt <= :legacyCutoff)
              )
            order by b.createdAt asc
            """)
    List<Booking> findExpiredUnpaidBookingsForUpdate(
            @Param("status") BookingStatus status,
            @Param("depositStatus") DepositStatus depositStatus,
            @Param("now") LocalDateTime now,
            @Param("legacyCutoff") LocalDateTime legacyCutoff
    );

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByUserIdAndSecurityDepositStatusOrderByCreatedAtDesc(
            Long userId,
            SecurityDepositStatus securityDepositStatus
    );

    List<Booking> findTop5ByOrderByCreatedAtDesc();

    long countByStatus(BookingStatus status);

    long countByStatusAndStartTimeGreaterThanEqualAndStartTimeLessThan(
            BookingStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    long countByStatusInAndEndTimeGreaterThanEqualAndEndTimeLessThan(
            Collection<BookingStatus> statuses,
            LocalDateTime from,
            LocalDateTime to
    );

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            LocalDateTime from,
            LocalDateTime to
    );

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            BookingStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    List<Booking> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
            LocalDateTime from,
            LocalDateTime to
    );
}
