package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.CarRequest;
import com.rentcity.Rentcity.dto.CarResponse;
import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.dto.PageResponse;
import com.rentcity.Rentcity.entity.CarStatus;
import com.rentcity.Rentcity.entity.Transmission;
import com.rentcity.Rentcity.service.CarService;
import com.rentcity.Rentcity.service.CarConditionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

/**
 * Admin REST API quản lý xe — Module B.
 *
 * POST   /admin/cars                       — B2: thêm xe (ADMIN)
 * PUT    /admin/cars/{id}                  — B3: sửa xe (ADMIN)
 * DELETE /admin/cars/{id}                  — B4: xóa mềm xe (ADMIN)
 * PATCH  /admin/cars/{id}/status           — B6: đổi trạng thái (ADMIN/STAFF)
 * POST   /admin/cars/{id}/images           — B5: upload nhiều ảnh (ADMIN)
 * POST   /admin/cars/{id}/images/single    — B5: upload một ảnh (ADMIN)
 * DELETE /admin/cars/{id}/images/{imageId} — B5: xóa ảnh (ADMIN)
 * PATCH  /admin/cars/{id}/images/{imageId}/primary — B5: đặt ảnh primary (ADMIN)
 * GET    /admin/cars                       — danh sách xe (ADMIN/STAFF, có filter + phân trang)
 * GET    /admin/cars/{id}                  — chi tiết xe (ADMIN/STAFF)
 */
@RestController
@RequestMapping("/admin/cars")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCarController {

    private final CarService carService;
    private final CarConditionService carConditionService;

    // ---- B1: Danh sách xe (admin view, bao gồm cả RETIRED) ----
    @GetMapping
    public ResponseEntity<PageResponse<CarResponse>> list(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Transmission transmission,
            @RequestParam(required = false) CarStatus status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        return ResponseEntity.ok(carService.search(
                branchId, categoryId, brand, transmission, status,
                minPrice, maxPrice, keyword, page, size, sortBy, direction));
    }

    // ---- Chi tiết xe ----
    @GetMapping("/{id}")
    public ResponseEntity<CarResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(carService.getById(id));
    }

    // ---- B2: Thêm xe ----
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> create(@Valid @RequestBody CarRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(carService.create(request));
    }

    // ---- B3: Sửa xe ----
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CarRequest request) {
        return ResponseEntity.ok(carService.update(id, request));
    }

    // ---- B4: Xóa mềm xe ----
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        carService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---- B6: Đổi trạng thái xe ----
    @PatchMapping("/{id}/status")
    public ResponseEntity<CarResponse> changeStatus(
            @PathVariable Long id,
            @RequestParam CarStatus status) {
        return ResponseEntity.ok(carService.changeStatus(id, status));
    }

    // ---- B5: Upload nhiều ảnh xe cùng lúc ----
    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "primaryIndex", required = false) Integer primaryIndex) {
        return ResponseEntity.ok(carService.uploadImages(id, files, primaryIndex));
    }

    // ---- B5: Upload một ảnh xe ----
    @PostMapping(value = "/{id}/images/single", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "primary", defaultValue = "false") boolean primary) {
        return ResponseEntity.ok(carService.uploadImage(id, file, primary));
    }

    // ---- B5: Xóa ảnh xe ----
    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        return ResponseEntity.ok(carService.deleteImage(id, imageId));
    }

    // ---- B5: Đặt ảnh làm primary ----
    @PatchMapping("/{id}/images/{imageId}/primary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CarResponse> setPrimaryImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        return ResponseEntity.ok(carService.setPrimaryImage(id, imageId));
    }

    @PostMapping(value = "/{id}/condition/images", consumes = "multipart/form-data")
    public ResponseEntity<CarConditionResponse> uploadInitialConditionImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(carConditionService.uploadInitialImages(id, files));
    }
}
