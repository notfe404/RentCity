package com.rentcity.Rentcity.config;

import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Nạp dữ liệu mẫu khi khởi động ứng dụng.
 * Idempotent — chỉ chạy khi bảng còn rỗng.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CarCategoryRepository categoryRepository;
    private final BranchRepository branchRepository;
    private final CarRepository carRepository;
    private final CarImageRepository carImageRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedCategoriesBranchesCars();
    }

    private void seedAdmin() {
        String adminEmail = "admin@rentcity.com";
        if (userRepository.existsByEmail(adminEmail)) return;
        userRepository.save(User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode("Admin1234"))
                .fullName("Quản trị viên Rent-City")
                .phone("0900000001")
                .role(Role.ADMIN)
                .kycStatus(KycStatus.VERIFIED)
                .build());
        log.info("[DataSeeder] ADMIN: {} / Admin1234", adminEmail);
    }

    private void seedCategoriesBranchesCars() {
        if (carRepository.count() > 0 || categoryRepository.count() > 0) return;

        CarCategory sedan    = categoryRepository.save(category("Sedan", 5));
        CarCategory suv      = categoryRepository.save(category("SUV", 7));
        CarCategory mpv      = categoryRepository.save(category("MPV", 7));
        CarCategory hatchback = categoryRepository.save(category("Hatchback", 5));

        Branch hanoi = branchRepository.save(
                branch("Chi nhánh Cầu Giấy", "88 Trần Thái Tông, Cầu Giấy", "0243766222", "Hà Nội"));

        Car vios = carRepository.save(car(sedan, hanoi, "51K-123.45", "Toyota", "Vios", 2022,
                Transmission.AUTO, "700000", "5000000", CarStatus.AVAILABLE,
                "Sedan hạng B tiết kiệm nhiên liệu, phù hợp đi phố và đi tỉnh."));

        Car city = carRepository.save(car(sedan, hanoi, "51K-678.90", "Honda", "City", 2023,
                Transmission.AUTO, "750000", "5000000", CarStatus.AVAILABLE,
                "Sedan hạng B rộng rãi, trang bị nhiều tính năng an toàn."));

        Car fortuner = carRepository.save(car(suv, hanoi, "30A-456.78", "Toyota", "Fortuner", 2021,
                Transmission.AUTO, "1300000", "10000000", CarStatus.AVAILABLE,
                "SUV 7 chỗ gầm cao, mạnh mẽ, thích hợp đi đường dài và địa hình xấu."));

        Car santafe = carRepository.save(car(suv, hanoi, "43A-111.22", "Hyundai", "SantaFe", 2022,
                Transmission.AUTO, "1400000", "10000000", CarStatus.MAINTENANCE,
                "SUV 7 chỗ cao cấp, đang trong lịch bảo dưỡng định kỳ."));

        Car xpander = carRepository.save(car(mpv, hanoi, "51K-999.88", "Mitsubishi", "Xpander", 2023,
                Transmission.MANUAL, "850000", "6000000", CarStatus.AVAILABLE,
                "MPV 7 chỗ phổ thông, không gian linh hoạt cho gia đình."));

        Car morning = carRepository.save(car(hatchback, hanoi, "30A-777.66", "Kia", "Morning", 2020,
                Transmission.MANUAL, "500000", "4000000", CarStatus.AVAILABLE,
                "Hatchback cỡ nhỏ, dễ lái, lý tưởng cho việc di chuyển trong thành phố."));

        // Ảnh xe — dùng Wikimedia Commons (CC BY-SA) làm nguồn mặc định
        seedImage(vios,     "https://upload.wikimedia.org/wikipedia/commons/e/e9/2022_Toyota_Vios_1.5_G_at_night.jpg");
        seedImage(city,     "https://upload.wikimedia.org/wikipedia/commons/4/43/HONDA_CITY_%28GM4%2CGM5%2CGM6%2CGM8%2CGM9%29_China_%284%29.jpg");
        seedImage(fortuner, "https://upload.wikimedia.org/wikipedia/commons/8/8b/2021_Toyota_Fortuner_2.4_TRD_Sportivo_%28Indonesia%29_front_view.jpg");
        seedImage(santafe,  "/uploads/cars/hyundai-santafe-2022.jpg"); // ảnh local đã commit
        seedImage(xpander,  "https://upload.wikimedia.org/wikipedia/commons/3/38/2023_Mitsubishi_Xpander_GT.jpg");
        seedImage(morning,  "https://upload.wikimedia.org/wikipedia/commons/7/7e/2020_Kia_Picanto_1_1.0_Front.jpg");

        log.info("[DataSeeder] Đã nạp {} loại xe, {} chi nhánh, {} xe mẫu.",
                categoryRepository.count(), branchRepository.count(), carRepository.count());
    }

    private void seedImage(Car car, String url) {
        carImageRepository.save(CarImage.builder()
                .car(car)
                .imageUrl(url)
                .isPrimary(true)
                .displayOrder(0)
                .build());
    }

    private CarCategory category(String name, int seats) {
        return CarCategory.builder().name(name).seats(seats).build();
    }

    private Branch branch(String name, String address, String phone, String city) {
        return Branch.builder().name(name).address(address).phone(phone).city(city).build();
    }

    private Car car(CarCategory category, Branch branch, String plate, String brand, String model,
                    int year, Transmission transmission, String pricePerDay, String deposit,
                    CarStatus status, String description) {
        return Car.builder()
                .category(category).branch(branch)
                .licensePlate(plate).brand(brand).model(model).year(year)
                .transmission(transmission)
                .pricePerDay(new BigDecimal(pricePerDay))
                .deposit(new BigDecimal(deposit))
                .status(status).description(description)
                .build();
    }
}
