package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.CarResponse;
import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.dto.PageResponse;
import com.rentcity.Rentcity.entity.CarStatus;
import com.rentcity.Rentcity.entity.Transmission;
import com.rentcity.Rentcity.service.CarService;
import com.rentcity.Rentcity.service.CarConditionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Endpoint công khai cho xe.
 * GET /cars/search  — tìm kiếm có điều kiện, phân trang, sắp xếp
 * GET /cars/available — xe trống theo ngày
 * GET /cars/{id}    — chi tiết một xe
 *
 * Admin CRUD tách sang AdminCarController (/admin/cars).
 */
@RestController
@RequestMapping("/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;
    private final CarConditionService carConditionService;

    @GetMapping("/search")
    public ResponseEntity<PageResponse<CarResponse>> search(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Transmission transmission,
            @RequestParam(required = false) CarStatus status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        return ResponseEntity.ok(carService.search(
                branchId, categoryId, brand, transmission, status,
                minPrice, maxPrice, keyword, page, size, sortBy, direction));
    }

    @GetMapping("/available")
    public ResponseEntity<List<CarResponse>> getAvailable(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Long branchId) {

        return ResponseEntity.ok(carService.getAvailable(from, to, branchId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CarResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(carService.getById(id));
    }

    @GetMapping("/{id}/condition")
    public ResponseEntity<CarConditionResponse> getCurrentCondition(@PathVariable Long id) {
        carService.getById(id);
        CarConditionResponse condition = carConditionService.getCurrent(id);
        return condition == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(condition);
    }
}
