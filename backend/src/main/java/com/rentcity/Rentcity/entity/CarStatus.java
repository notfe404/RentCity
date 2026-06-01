package com.rentcity.Rentcity.entity;

/**
 * Trạng thái dài hạn của một chiếc xe (không phải "rảnh ngày X hay không").
 * AVAILABLE   - sẵn sàng cho thuê
 * MAINTENANCE - đang bảo dưỡng tạm thời
 * RETIRED     - đã thanh lý vĩnh viễn
 */
public enum CarStatus {
    AVAILABLE,
    MAINTENANCE,
    RETIRED
}
