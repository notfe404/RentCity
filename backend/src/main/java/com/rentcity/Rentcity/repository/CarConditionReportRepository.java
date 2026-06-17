package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.CarConditionReport;
import com.rentcity.Rentcity.entity.CarConditionReportType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CarConditionReportRepository extends JpaRepository<CarConditionReport, Long> {
    Optional<CarConditionReport> findFirstByCarIdOrderByCreatedAtDesc(Long carId);
    Optional<CarConditionReport> findFirstByBookingIdAndReportTypeOrderByCreatedAtDesc(
            Long bookingId,
            CarConditionReportType reportType
    );
    List<CarConditionReport> findByBookingIdOrderByCreatedAtAsc(Long bookingId);
}
