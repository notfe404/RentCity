package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Bảng car_images — ảnh của xe (quan hệ 1-N với cars).
 * Mỗi xe có 1 ảnh đại diện (is_primary = true).
 */
@Entity
@Table(name = "car_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Xe mà ảnh này thuộc về. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    /** Đường dẫn file ảnh, ví dụ /uploads/cars/vios-1.jpg */
    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    /** Có phải ảnh đại diện không. */
    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    /** Thứ tự hiển thị (nhỏ hơn = hiển thị trước). */
    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
