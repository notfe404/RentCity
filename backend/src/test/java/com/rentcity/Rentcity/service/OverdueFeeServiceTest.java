package com.rentcity.Rentcity.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class OverdueFeeServiceTest {

    private final OverdueFeeService service = new OverdueFeeService();

    @Test
    void onTimeReturnHasNoFee() {
        LocalDateTime scheduled = LocalDateTime.of(2026, 6, 15, 10, 0);
        OverdueFeeService.OverdueCharge charge = service.calculate(
                scheduled,
                scheduled,
                new BigDecimal("2400000")
        );

        assertThat(charge.overdueMinutes()).isZero();
        assertThat(charge.billableHours()).isZero();
        assertThat(charge.fee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(charge.penaltyFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(charge.totalFee()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void overdueFeeRoundsPartialHoursUp() {
        LocalDateTime scheduled = LocalDateTime.of(2026, 6, 15, 10, 0);
        OverdueFeeService.OverdueCharge charge = service.calculate(
                scheduled,
                scheduled.plusHours(1).plusMinutes(1),
                new BigDecimal("2400000")
        );

        assertThat(charge.overdueMinutes()).isEqualTo(61);
        assertThat(charge.billableHours()).isEqualTo(2);
        assertThat(charge.fee()).isEqualByComparingTo("200000");
        assertThat(charge.penaltyFee()).isEqualByComparingTo("30000");
        assertThat(charge.totalFee()).isEqualByComparingTo("230000");
    }

    @Test
    void earlyHandoverWithOnTimeReturnHasNoOverdueFee() {
        LocalDateTime scheduledStart = LocalDateTime.of(2026, 6, 15, 10, 0);
        LocalDateTime scheduledReturn = scheduledStart.plusHours(4);

        OverdueFeeService.OverdueCharge charge = service.calculate(
                scheduledStart,
                scheduledStart.minusMinutes(61),
                scheduledReturn,
                scheduledReturn,
                new BigDecimal("2400000")
        );

        assertThat(charge.overdueMinutes()).isZero();
        assertThat(charge.billableHours()).isZero();
        assertThat(charge.fee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(charge.penaltyFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(charge.totalFee()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void earlyAndLateMinutesAreCombinedBeforeRounding() {
        LocalDateTime scheduledStart = LocalDateTime.of(2026, 6, 15, 10, 0);
        LocalDateTime scheduledReturn = scheduledStart.plusHours(4);

        OverdueFeeService.OverdueCharge charge = service.calculate(
                scheduledStart,
                scheduledStart.minusMinutes(30),
                scheduledReturn,
                scheduledReturn.plusMinutes(30),
                new BigDecimal("2400000")
        );

        assertThat(charge.overdueMinutes()).isEqualTo(60);
        assertThat(charge.billableHours()).isEqualTo(1);
        assertThat(charge.fee()).isEqualByComparingTo("100000");
        assertThat(charge.penaltyFee()).isEqualByComparingTo("15000");
        assertThat(charge.totalFee()).isEqualByComparingTo("115000");
    }

    @Test
    void earlyReturnHasNoOverdueFeeEvenAfterEarlyHandover() {
        LocalDateTime scheduledStart = LocalDateTime.of(2026, 6, 24, 17, 0);
        LocalDateTime scheduledReturn = LocalDateTime.of(2026, 6, 24, 21, 0);

        OverdueFeeService.OverdueCharge charge = service.calculate(
                scheduledStart,
                scheduledStart.minusMinutes(7),
                scheduledReturn,
                scheduledReturn.minusMinutes(6),
                new BigDecimal("1300000")
        );

        assertThat(charge.overdueMinutes()).isZero();
        assertThat(charge.billableHours()).isZero();
        assertThat(charge.fee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(charge.penaltyFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(charge.totalFee()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
