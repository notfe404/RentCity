package com.rentcity.Rentcity.config;

import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.repository.BranchRepository;
import com.rentcity.Rentcity.repository.CarCategoryRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Nạp dữ liệu mẫu cho Module B khi khởi động ứng dụng.
 * Chỉ chạy khi bảng còn rỗng (idempotent) nên an toàn khi khởi động lại nhiều lần.
 * Tắt bằng cách đặt app.seed.enabled=false trong application.yml.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CarCategoryRepository categoryRepository;
    private final BranchRepository branchRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedCategoriesBranchesCars();
    }

    /** Tạo sẵn 1 tài khoản ADMIN để test các API cần quyền quản trị. */
    private void seedAdmin() {
        String adminEmail = "admin@rentcity.com";
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }
        User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode("Admin1234"))
                .fullName("Quản trị viên Rent-City")
                .phone("0900000001")
                .role(Role.ADMIN)
                .kycStatus(KycStatus.VERIFIED)
                .build();
        userRepository.save(admin);
        log.info("[DataSeeder] Đã tạo tài khoản ADMIN: {} / Admin1234", adminEmail);
    }

    /** Nạp loại xe, chi nhánh và xe mẫu. */
    private void seedCategoriesBranchesCars() {
        if (carRepository.count() > 0 || categoryRepository.count() > 0) {
            return; // đã có dữ liệu, bỏ qua
        }

        // ----- Loại xe -----
        CarCategory sedan = categoryRepository.save(category("Sedan", 5));
        CarCategory suv = categoryRepository.save(category("SUV", 7));
        CarCategory mpv = categoryRepository.save(category("MPV", 7));
        CarCategory hatchback = categoryRepository.save(category("Hatchback", 5));

        // ----- Chi nhánh -----
        Branch hanoi = branchRepository.save(
                branch("Chi nhánh Cầu Giấy", "88 Trần Thái Tông, Cầu Giấy", "0243766222", "Hà Nội"));

        // ----- Xe mẫu -----
        carRepository.saveAll(List.of(
                car(sedan, hanoi, "51K-123.45", "Toyota", "Vios", 2022, Transmission.AUTO,
                        "700000", "5000000", CarStatus.AVAILABLE,
                        "Sedan hạng B tiết kiệm nhiên liệu, phù hợp đi phố và đi tỉnh."),
                car(sedan, hanoi, "51K-678.90", "Honda", "City", 2023, Transmission.AUTO,
                        "750000", "5000000", CarStatus.AVAILABLE,
                        "Sedan hạng B rộng rãi, trang bị nhiều tính năng an toàn."),
                car(suv, hanoi, "30A-456.78", "Toyota", "Fortuner", 2021, Transmission.AUTO,
                        "1300000", "10000000", CarStatus.AVAILABLE,
                        "SUV 7 chỗ gầm cao, mạnh mẽ, thích hợp đi đường dài và địa hình xấu."),
                car(suv, hanoi, "43A-111.22", "Hyundai", "SantaFe", 2022, Transmission.AUTO,
                        "1400000", "10000000", CarStatus.MAINTENANCE,
                        "SUV 7 chỗ cao cấp, đang trong lịch bảo dưỡng định kỳ."),
                car(mpv, hanoi, "51K-999.88", "Mitsubishi", "Xpander", 2023, Transmission.MANUAL,
                        "850000", "6000000", CarStatus.AVAILABLE,
                        "MPV 7 chỗ phổ thông, không gian linh hoạt cho gia đình."),
                car(hatchback, hanoi, "30A-777.66", "Kia", "Morning", 2020, Transmission.MANUAL,
                        "500000", "4000000", CarStatus.AVAILABLE,
                        "Hatchback cỡ nhỏ, dễ lái, lý tưởng cho việc di chuyển trong thành phố.")
        ));

        log.info("[DataSeeder] Đã nạp {} loại xe, {} chi nhánh, {} xe mẫu.",
                categoryRepository.count(), branchRepository.count(), carRepository.count());
    }

    // ----- Helper dựng entity -----

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
                .category(category)
                .branch(branch)
                .licensePlate(plate)
                .brand(brand)
                .model(model)
                .year(year)
                .transmission(transmission)
                .pricePerDay(new BigDecimal(pricePerDay))
                .deposit(new BigDecimal(deposit))
                .status(status)
                .description(description)
                .build();
    }
}
