package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Bảng cars — mỗi dòng là MỘT chiếc xe vật lý cụ thể (không phải mẫu xe).
 * Trung tâm của module Fleet (Module B).
 */
@Entity
@Table(name = "cars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Loại xe (Sedan/SUV...). Có thể null nếu chưa phân loại. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private CarCategory category;

    /** Chi nhánh đang quản lý xe. Có thể null. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    /** Biển số xe — UNIQUE (không có 2 xe trùng biển ở Việt Nam). */
    @Column(name = "license_plate", unique = true, nullable = false, length = 20)
    private String licensePlate;

    /** Hãng xe (Toyota, Honda...). */
    @Column(nullable = false, length = 50)
    private String brand;

    /** Tên dòng xe (Vios, City...). */
    @Column(nullable = false, length = 50)
    private String model;

    /** Năm sản xuất. */
    @Column(name = "year_made")
    private Integer year;

    /** AUTO hay MANUAL. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Transmission transmission;

    /** Giá thuê 1 ngày. Dùng decimal (BigDecimal) để tính tiền chính xác. */
    @Column(name = "price_per_day", nullable = false, precision = 12, scale = 0)
    private BigDecimal pricePerDay;

    /** Tiền cọc khi nhận xe. */
    @Column(precision = 12, scale = 0)
    private BigDecimal deposit;

    /** Trạng thái dài hạn của xe. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CarStatus status;

    /** Mô tả chi tiết xe. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Danh sách ảnh của xe (quan hệ 1-N). */
    @Builder.Default
    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CarImage> images = new ArrayList<>();
}
