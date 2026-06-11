package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.CarStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Car.
 * Kế thừa JpaSpecificationExecutor để hỗ trợ tìm kiếm động (B3 — JPA Specification).
 */
@Repository
public interface CarRepository extends JpaRepository<Car, Long>, JpaSpecificationExecutor<Car> {

    boolean existsByLicensePlate(String licensePlate);

    boolean existsByLicensePlateAndIdNot(String licensePlate, Long id);

    /** Kiểm tra còn xe nào thuộc chi nhánh — chặn xóa chi nhánh đang được dùng. */
    boolean existsByBranchId(Long branchId);

    /** Kiểm tra còn xe nào thuộc loại — chặn xóa loại xe đang được dùng. */
    boolean existsByCategoryId(Long categoryId);

    long countByStatus(CarStatus status);

    @Query("""
            select count(c)
            from Car c
            where c.images is empty
            """)
    long countCarsWithoutImages();

    List<Car> findByStatus(CarStatus status);

    List<Car> findByStatusAndBranchId(CarStatus status, Long branchId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Car c where c.id = :id")
    Optional<Car> findByIdForUpdate(@Param("id") Long id);
}
