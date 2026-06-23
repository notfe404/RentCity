package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {
    Optional<RentalContract> findByBookingId(Long bookingId);
}

