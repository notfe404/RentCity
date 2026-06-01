package com.rentcity.Rentcity.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Bảng branches — chi nhánh cho thuê xe.
 * Bảng mở rộng ngoài ERD MVP (MVP giả định 1 chi nhánh duy nhất).
 * Phục vụ Module B: CRUD chi nhánh và filter xe theo chi nhánh.
 */
@Entity
@Table(name = "branches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên chi nhánh — UNIQUE. */
    @Column(unique = true, nullable = false, length = 100)
    private String name;

    /** Địa chỉ chi nhánh. */
    @Column(length = 255)
    private String address;

    /** Số điện thoại liên hệ chi nhánh. */
    @Column(length = 20)
    private String phone;

    /** Thành phố — dùng để filter / nhóm chi nhánh. */
    @Column(length = 100)
    private String city;
}
