package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.*;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BranchRepository;
import com.rentcity.Rentcity.repository.CarCategoryRepository;
import com.rentcity.Rentcity.repository.CarImageRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.specification.CarSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Nghiệp vụ quản lý xe — Module B.
 * B1 CRUD xe · B3 Search · B4 Check available · B5 Pagination/Sort · B6 Upload ảnh.
 */
@Service
@RequiredArgsConstructor
public class CarService {

    private static final Set<String> SORTABLE = Set.of("id", "pricePerDay", "year", "brand");
    private static final int MAX_PAGE_SIZE = 100;

    private final CarRepository carRepository;
    private final CarCategoryRepository categoryRepository;
    private final BranchRepository branchRepository;
    private final CarImageRepository carImageRepository;
    private final FileStorageService fileStorageService;
    private final BookingAvailabilityService bookingAvailabilityService;
    private final ReviewService reviewService;
    private final CarConditionService carConditionService;

    // ---------------------------------------------------------------
    // B2 — Thêm xe
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse create(CarRequest request) {
        if (carRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new IllegalArgumentException("Biển số xe đã tồn tại: " + request.getLicensePlate());
        }
        if (request.getInitialCondition() == null) {
            throw new IllegalArgumentException("Initial car condition is required");
        }
        Car car = new Car();
        applyRequest(car, request);
        car.setStatus(request.getStatus() != null ? request.getStatus() : CarStatus.AVAILABLE);
        Car savedCar = carRepository.save(car);
        carConditionService.createInitial(savedCar.getId(), request.getInitialCondition(), null, Role.ADMIN);
        return mapToResponse(savedCar);
    }

    // ---------------------------------------------------------------
    // B3 — Sửa thông tin xe
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse update(Long id, CarRequest request) {
        Car car = findCar(id);
        if (carRepository.existsByLicensePlateAndIdNot(request.getLicensePlate(), id)) {
            throw new IllegalArgumentException("Biển số xe đã tồn tại: " + request.getLicensePlate());
        }
        applyRequest(car, request);
        if (request.getStatus() != null) {
            car.setStatus(request.getStatus());
        }
        return mapToResponse(carRepository.save(car));
    }

    // ---------------------------------------------------------------
    // B4 — Xóa mềm xe
    // ---------------------------------------------------------------

    @Transactional
    public void delete(Long id) {
        Car car = findCar(id);
        car.setStatus(CarStatus.RETIRED);
        carRepository.save(car);
    }

    @Transactional(readOnly = true)
    public CarResponse getById(Long id) {
        return mapToResponse(findCar(id));
    }

    // ---------------------------------------------------------------
    // B1 — Search + Pagination + Sort (public)
    // ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public PageResponse<CarResponse> search(
            Long branchId, Long categoryId, String brand,
            Transmission transmission, CarStatus status,
            BigDecimal minPrice, BigDecimal maxPrice, String keyword,
            int page, int size, String sortBy, String direction) {

        String sortField = SORTABLE.contains(sortBy) ? sortBy : "id";
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

        int safePage = Math.max(page, 0);
        int safeSize = (size < 1) ? 10 : Math.min(size, MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(dir, sortField));

        Specification<Car> spec = CarSpecification.withFilters(
                branchId, categoryId, brand, transmission, status, minPrice, maxPrice, keyword);

        Page<Car> result = carRepository.findAll(spec, pageable);
        List<CarResponse> content = result.getContent().stream().map(this::mapToResponse).toList();
        return PageResponse.of(result, content);
    }

    // ---------------------------------------------------------------
    // Check xe available theo ngày
    // ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CarResponse> getAvailable(LocalDateTime from, LocalDateTime to, Long branchId) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Cần cung cấp đầy đủ ngày bắt đầu (from) và ngày kết thúc (to)");
        }
        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("Ngày bắt đầu phải trước ngày kết thúc");
        }
        List<Car> cars = (branchId != null)
                ? carRepository.findByStatusAndBranchId(CarStatus.AVAILABLE, branchId)
                : carRepository.findByStatus(CarStatus.AVAILABLE);

        if (cars.isEmpty()) {
            return List.of();
        }

        Set<Long> unavailableCarIds = bookingAvailabilityService.findUnavailableCarIds(from, to);

        return cars.stream()
                .filter(car -> !unavailableCarIds.contains(car.getId()))
                .map(this::mapToResponse)
                .toList();
    }

    // ---------------------------------------------------------------
    // B5 — Upload ảnh xe (một ảnh)
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse uploadImage(Long carId, MultipartFile file, boolean primary) {
        Car car = findCar(carId);
        String url = fileStorageService.store(file, "cars");

        boolean makePrimary = primary || car.getImages().isEmpty();
        if (makePrimary) {
            car.getImages().forEach(img -> img.setPrimary(false));
        }

        int nextOrder = car.getImages().stream().mapToInt(CarImage::getDisplayOrder).max().orElse(-1) + 1;

        CarImage image = CarImage.builder()
                .car(car)
                .imageUrl(url)
                .isPrimary(makePrimary)
                .displayOrder(nextOrder)
                .build();
        car.getImages().add(image);
        carImageRepository.save(image);

        return mapToResponse(car);
    }

    // ---------------------------------------------------------------
    // B5 — Upload nhiều ảnh cùng lúc
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse uploadImages(Long carId, List<MultipartFile> files, Integer primaryIndex) {
        Car car = findCar(carId);

        int baseOrder = car.getImages().stream().mapToInt(CarImage::getDisplayOrder).max().orElse(-1) + 1;
        boolean hasExistingPrimary = car.getImages().stream().anyMatch(CarImage::isPrimary);

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            if (file == null || file.isEmpty()) continue;

            String url = fileStorageService.store(file, "cars");
            boolean makePrimary = (primaryIndex != null && primaryIndex == i)
                    || (!hasExistingPrimary && i == 0);

            if (makePrimary) {
                car.getImages().forEach(img -> img.setPrimary(false));
                hasExistingPrimary = true;
            }

            CarImage image = CarImage.builder()
                    .car(car)
                    .imageUrl(url)
                    .isPrimary(makePrimary)
                    .displayOrder(baseOrder + i)
                    .build();
            car.getImages().add(image);
            carImageRepository.save(image);
        }

        return mapToResponse(carRepository.save(car));
    }

    // ---------------------------------------------------------------
    // B5 — Xóa một ảnh xe
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse deleteImage(Long carId, Long imageId) {
        Car car = findCar(carId);
        CarImage image = carImageRepository.findById(imageId)
                .filter(img -> img.getCar().getId().equals(carId))
                .orElseThrow(() -> new ResourceNotFoundException("ảnh xe", imageId));

        boolean wasPrimary = image.isPrimary();
        car.getImages().remove(image);
        carImageRepository.delete(image);
        fileStorageService.delete(image.getImageUrl());

        // Nếu ảnh bị xóa là primary, tự động đặt ảnh đầu tiên còn lại làm primary
        if (wasPrimary && !car.getImages().isEmpty()) {
            car.getImages().get(0).setPrimary(true);
        }

        return mapToResponse(carRepository.save(car));
    }

    // ---------------------------------------------------------------
    // B5 — Đặt ảnh làm primary
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse setPrimaryImage(Long carId, Long imageId) {
        Car car = findCar(carId);
        CarImage target = carImageRepository.findById(imageId)
                .filter(img -> img.getCar().getId().equals(carId))
                .orElseThrow(() -> new ResourceNotFoundException("ảnh xe", imageId));

        car.getImages().forEach(img -> img.setPrimary(img.getId().equals(imageId)));
        carImageRepository.saveAll(car.getImages());

        return mapToResponse(carRepository.save(car));
    }

    // ---------------------------------------------------------------
    // B6 — Đổi trạng thái xe (AVAILABLE ↔ MAINTENANCE)
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse changeStatus(Long id, CarStatus newStatus) {
        Car car = findCar(id);
        if (newStatus == null) {
            throw new IllegalArgumentException("Trạng thái xe không được để trống");
        }
        car.setStatus(newStatus);
        return mapToResponse(carRepository.save(car));
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private Car findCar(Long id) {
        return carRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("xe", id));
    }

    private void applyRequest(Car car, CarRequest request) {
        car.setLicensePlate(request.getLicensePlate().trim());
        car.setBrand(request.getBrand().trim());
        car.setModel(request.getModel().trim());
        car.setYear(request.getYear());
        car.setTransmission(request.getTransmission());
        car.setPricePerDay(request.getPricePerDay());
        car.setDeposit(request.getDeposit());
        car.setDescription(request.getDescription());
        car.setSeats(request.getSeats());

        if (request.getCategoryId() != null) {
            CarCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("loại xe", request.getCategoryId()));
            car.setCategory(category);
        } else {
            car.setCategory(null);
        }

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("chi nhánh", request.getBranchId()));
            car.setBranch(branch);
        } else {
            car.setBranch(null);
        }
    }

    public CarResponse mapToResponse(Car car) {
        List<CarImageResponse> images = car.getImages().stream()
                .sorted(java.util.Comparator.comparingInt(CarImage::getDisplayOrder))
                .map(i -> CarImageResponse.builder()
                        .id(i.getId())
                        .imageUrl(i.getImageUrl())
                        .primary(i.isPrimary())
                        .displayOrder(i.getDisplayOrder())
                        .build())
                .toList();

        String primaryUrl = car.getImages().stream()
                .filter(CarImage::isPrimary)
                .map(CarImage::getImageUrl)
                .findFirst()
                .orElse(null);

        CarCategory category = car.getCategory();
        Branch branch = car.getBranch();

        // Số chỗ: ưu tiên giá trị trực tiếp trên xe, fallback về category.seats
        Integer seats = car.getSeats() != null ? car.getSeats()
                : (category != null ? category.getSeats() : null);

        return CarResponse.builder()
                .id(car.getId())
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getName() : null)
                .seats(seats)
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : null)
                .licensePlate(car.getLicensePlate())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .transmission(car.getTransmission())
                .pricePerDay(car.getPricePerDay())
                .deposit(car.getDeposit())
                .status(car.getStatus())
                .description(car.getDescription())
                .averageRating(reviewService.getAverageVisibleRating(car.getId()))
                .reviewCount(reviewService.getVisibleReviewCount(car.getId()))
                .primaryImageUrl(primaryUrl)
                .images(images)
                .currentCondition(carConditionService.getCurrent(car.getId()))
                .build();
    }
}
