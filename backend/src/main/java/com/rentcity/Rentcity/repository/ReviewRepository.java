package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByBookingId(Long bookingId);

    Optional<Review> findByBookingIdAndUserId(Long bookingId, Long userId);

    Page<Review> findByCarIdAndIsVisibleTrueOrderByCreatedAtDesc(Long carId, Pageable pageable);

    List<Review> findAllByOrderByCreatedAtDesc();

    long countByCarIdAndIsVisibleTrue(Long carId);

    @Query("select coalesce(avg(r.overallRating), 0) from Review r where r.carId = :carId and r.isVisible = true")
    double averageVisibleOverallRatingByCarId(@Param("carId") Long carId);

    @Query("select r.overallRating, count(r) from Review r where r.carId = :carId and r.isVisible = true group by r.overallRating")
    List<Object[]> countVisibleReviewsByRating(@Param("carId") Long carId);
}
