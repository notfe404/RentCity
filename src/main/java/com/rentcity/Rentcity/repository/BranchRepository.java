package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
    Optional<Branch> findByName(String name);
}
