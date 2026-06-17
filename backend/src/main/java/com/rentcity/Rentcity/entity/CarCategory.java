package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Bảng car_categories — loại xe (Sedan, SUV, MPV, Hatchback...).
 * Bảng lookup: lưu các giá trị cố định để tránh sai chính tả và filter nhanh.
 */
@Entity
@Table(name = "car_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên loại xe — UNIQUE để không tạo trùng. */
    @Column(unique = true, nullable = false, length = 50)
    private String name;

    /** Số chỗ ngồi đặc trưng của loại này. */
    @Column(nullable = false)
    private Integer seats;

    /** Mô tả loại xe. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Giá thuê cơ bản / ngày cho loại xe này (gợi ý, xe có thể override). */
    @Column(name = "base_price_day", precision = 12, scale = 0)
    private BigDecimal basePriceDay;

    /** Tỷ lệ tiền cọc (0.0 – 1.0). Ví dụ 0.3 = 30% giá thuê. */
    @Column(name = "deposit_rate", precision = 4, scale = 2)
    private BigDecimal depositRate;

    /** Loại xe còn hoạt động hay đã tắt. */
    @Builder.Default
    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    private boolean isActive = true;
}
