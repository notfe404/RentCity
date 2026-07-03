package com.rentcity.Rentcity.dto;

import com.rentcity.Rentcity.entity.CarCondition;
import com.rentcity.Rentcity.entity.CarConditionReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarConditionResponse {
    private Long id;
    private Long carId;
    private Long bookingId;
    private CarConditionReportType reportType;
    private CarCondition condition;
    private boolean damageFound;
    private String notes;
    private LocalDateTime createdAt;
    private List<CarConditionImageResponse> images;
}
