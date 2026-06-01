package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CategoryRequest;
import com.rentcity.Rentcity.dto.CategoryResponse;
import com.rentcity.Rentcity.entity.CarCategory;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.CarCategoryRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Nghiệp vụ quản lý loại xe (car_categories). */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CarCategoryRepository categoryRepository;
    private final CarRepository carRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActive() {
        return categoryRepository.findAllByIsActiveTrue().stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return mapToResponse(findCategory(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Loại xe đã tồn tại: " + request.getName());
        }
        CarCategory category = CarCategory.builder()
                .name(request.getName().trim())
                .seats(request.getSeats())
                .description(request.getDescription())
                .basePriceDay(request.getBasePriceDay())
                .depositRate(request.getDepositRate())
                .isActive(request.isActive())
                .build();
        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        CarCategory category = findCategory(id);
        if (categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new IllegalArgumentException("Loại xe đã tồn tại: " + request.getName());
        }
        category.setName(request.getName().trim());
        category.setSeats(request.getSeats());
        category.setDescription(request.getDescription());
        category.setBasePriceDay(request.getBasePriceDay());
        category.setDepositRate(request.getDepositRate());
        category.setActive(request.isActive());
        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        CarCategory category = findCategory(id);
        if (carRepository.existsByCategoryId(id)) {
            throw new IllegalArgumentException("Không thể xóa loại xe đang được gán cho xe");
        }
        categoryRepository.delete(category);
    }

    private CarCategory findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("loại xe", id));
    }

    private CategoryResponse mapToResponse(CarCategory c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .seats(c.getSeats())
                .description(c.getDescription())
                .basePriceDay(c.getBasePriceDay())
                .depositRate(c.getDepositRate())
                .isActive(c.isActive())
                .build();
    }
}
