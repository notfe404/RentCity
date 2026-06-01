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

    /** Các cột được phép sort (B5) — chặn cột lạ gây lỗi truy vấn. */
    private static final Set<String> SORTABLE = Set.of("id", "pricePerDay", "year", "brand");
    private static final int MAX_PAGE_SIZE = 100;

    private final CarRepository carRepository;
    private final CarCategoryRepository categoryRepository;
    private final BranchRepository branchRepository;
    private final CarImageRepository carImageRepository;
    private final FileStorageService fileStorageService;
    private final BookingAvailabilityService bookingAvailabilityService;

    // ---------------------------------------------------------------
    // B1 — CRUD xe
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse create(CarRequest request) {
        if (carRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new IllegalArgumentException("Biển số xe đã tồn tại: " + request.getLicensePlate());
        }
        Car car = new Car();
        applyRequest(car, request);
        car.setStatus(request.getStatus() != null ? request.getStatus() : CarStatus.AVAILABLE);
        return mapToResponse(carRepository.save(car));
    }

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
    // B3 + B5 — Search có điều kiện + phân trang + sắp xếp
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
    // B4 — Check xe available theo ngày
    // ---------------------------------------------------------------

    /**
     * Trả về danh sách xe có thể thuê trong khoảng [from, to].
     * Chỉ trả về xe trạng thái AVAILABLE và không có booking active chồng lấn khoảng thời gian.
     */
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
    // B6 — Upload ảnh xe
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse uploadImage(Long carId, MultipartFile file, boolean primary) {
        Car car = findCar(carId);
        String url = fileStorageService.store(file, "cars");

        // Ảnh đầu tiên của xe tự động trở thành ảnh đại diện
        boolean makePrimary = primary || car.getImages().isEmpty();
        if (makePrimary) {
            car.getImages().forEach(img -> img.setPrimary(false));
        }

        CarImage image = CarImage.builder()
                .car(car)
                .imageUrl(url)
                .isPrimary(makePrimary)
                .build();
        car.getImages().add(image);
        carImageRepository.save(image);

        return mapToResponse(car);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    @Transactional
    public CarResponse changeStatus(Long id, CarStatus newStatus) {
        Car car = findCar(id);
        if (newStatus != null) {
            car.setStatus(newStatus);
        }
        return mapToResponse(carRepository.save(car));
    }

    private Car findCar(Long id) {
        return carRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("xe", id));
    }

    /** Gán dữ liệu từ request vào entity (dùng chung cho create và update). */
    private void applyRequest(Car car, CarRequest request) {
        car.setLicensePlate(request.getLicensePlate().trim());
        car.setBrand(request.getBrand().trim());
        car.setModel(request.getModel().trim());
        car.setYear(request.getYear());
        car.setTransmission(request.getTransmission());
        car.setPricePerDay(request.getPricePerDay());
        car.setDeposit(request.getDeposit());
        car.setDescription(request.getDescription());

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

    private CarResponse mapToResponse(Car car) {
        List<CarImageResponse> images = car.getImages().stream()
                .map(i -> CarImageResponse.builder()
                        .id(i.getId())
                        .imageUrl(i.getImageUrl())
                        .primary(i.isPrimary())
                        .build())
                .toList();

        String primaryUrl = car.getImages().stream()
                .filter(CarImage::isPrimary)
                .map(CarImage::getImageUrl)
                .findFirst()
                .orElse(null);

        CarCategory category = car.getCategory();
        Branch branch = car.getBranch();

        return CarResponse.builder()
                .id(car.getId())
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getName() : null)
                .seats(category != null ? category.getSeats() : null)
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
                .primaryImageUrl(primaryUrl)
                .images(images)
                .build();
    }
}
