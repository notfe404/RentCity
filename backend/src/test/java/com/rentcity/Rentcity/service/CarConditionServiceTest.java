package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CarConditionRequest;
import com.rentcity.Rentcity.entity.CarCondition;
import com.rentcity.Rentcity.entity.CarConditionReport;
import com.rentcity.Rentcity.entity.CarConditionReportType;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.repository.CarConditionImageRepository;
import com.rentcity.Rentcity.repository.CarConditionReportRepository;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CarConditionServiceTest {

    private final CarConditionReportRepository reportRepository = mock(CarConditionReportRepository.class);
    private final CarConditionService service = new CarConditionService(
            reportRepository,
            mock(CarConditionImageRepository.class),
            mock(FileStorageService.class)
    );

    @Test
    void initialReportAlwaysUsesGoodCondition() {
        when(reportRepository.save(any(CarConditionReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CarConditionReport report = service.createInitial(
                10L,
                CarConditionRequest.builder()
                        .condition(CarCondition.GOOD)
                        .odometer(1200L)
                        .fuelLevel(90)
                        .damageFound(false)
                        .notes("Clean")
                        .build(),
                2L,
                Role.ADMIN
        );

        assertThat(report.getReportType()).isEqualTo(CarConditionReportType.INITIAL);
        assertThat(report.getCondition()).isEqualTo(CarCondition.GOOD);
        assertThat(report.getOdometer()).isEqualTo(1200L);
        assertThat(report.getFuelLevel()).isEqualTo(90);
    }
}
