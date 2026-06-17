package com.rentcity.Rentcity.dto;

import lombok.*;

/** Dữ liệu chi nhánh trả ra ngoài. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchResponse {
    private Long id;
    private String name;
    private String address;
    private String phone;
    private String city;
}