package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.CarRequest;
import com.rentcity.Rentcity.dto.CarResponse;
import com.rentcity.Rentcity.dto.PageResponse;
import com.rentcity.Rentcity.entity.CarStatus;
import com.rentcity.Rentcity.entity.Transmission;
import com.rentcity.Rentcity.service.CarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * REST API quản lý xe — Module B.
 * Đường dẫn đầy đủ có tiền tố context-path /api (ví dụ: /api/cars).
 *
 * GET  /cars/search      — B3 + B5: tìm kiếm có điều kiện, phân trang, sắp xếp (public)
 * GET  /cars/available   — B4: kiểm tra xe trống theo ngày (public)
 * GET  /cars/{id}        — xem chi tiết 1 xe (public)
 * POST /cars             — B1: thêm xe (ADMIN)
 * PUT  /cars/{id}        — B1: sửa xe (ADMIN)
 * DELETE /cars/{id}      — B1: xóa xe (ADMIN)
 * POST /cars/{id}/image  — B6: upload ảnh xe (ADMIN)
 */
@RestController
@RequestMapping("/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    // ---- B3 + B5: Search + Pagination + Sort ----
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

    // ---- B4: Check available theo ngày ----
    @GetMapping("/available")
    public ResponseEntity<List<CarResponse>> getAvailable(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long branchId) {

        return ResponseEntity.ok(carService.getAvailable(from, to, branchId));
    }

    // ---- Xem chi tiết 1 xe ----
    @GetMapping("/{id}")
    public ResponseEntity<CarResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(carService.getById(id));
    }

    // ---- B1: Thêm xe ----
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> create(@Valid @RequestBody CarRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(carService.create(request));
    }

    // ---- B1: Sửa xe ----
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CarRequest request) {
        return ResponseEntity.ok(carService.update(id, request));
    }

    // ---- B1: Xóa xe ----
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        carService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---- B6: Đổi trạng thái xe ----
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<CarResponse> changeStatus(
            @PathVariable Long id,
            @RequestParam CarStatus status) {
        return ResponseEntity.ok(carService.changeStatus(id, status));
    }

    // ---- B5: Upload ảnh xe ----
    @PostMapping(value = "/{id}/image", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "primary", defaultValue = "false") boolean primary) {
        return ResponseEntity.ok(carService.uploadImage(id, file, primary));
    }
}
