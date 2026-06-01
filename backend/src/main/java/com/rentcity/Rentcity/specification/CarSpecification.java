package com.rentcity.Rentcity.specification;

import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.CarStatus;
import com.rentcity.Rentcity.entity.Transmission;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Xây dựng câu truy vấn động cho việc tìm kiếm xe (B3).
 * Mỗi tiêu chí chỉ được thêm vào khi có giá trị → cho phép filter linh hoạt.
 */
public class CarSpecification {

    private CarSpecification() {
        // lớp tiện ích, không khởi tạo
    }

    public static Specification<Car> withFilters(
            Long branchId,
            Long categoryId,
            String brand,
            Transmission transmission,
            CarStatus status,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (branchId != null) {
                predicates.add(cb.equal(root.get("branch").get("id"), branchId));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (brand != null && !brand.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.<String>get("brand")), brand.trim().toLowerCase()));
            }
            if (transmission != null) {
                predicates.add(cb.equal(root.get("transmission"), transmission));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("pricePerDay"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("pricePerDay"), maxPrice));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.<String>get("brand")), like),
                        cb.like(cb.lower(root.<String>get("model")), like),
                        cb.like(cb.lower(root.<String>get("licensePlate")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
