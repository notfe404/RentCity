package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

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
}
