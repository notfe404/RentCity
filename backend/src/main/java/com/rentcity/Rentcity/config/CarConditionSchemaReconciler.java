package com.rentcity.Rentcity.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class CarConditionSchemaReconciler implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute(
                "ALTER TABLE IF EXISTS car_condition_reports " +
                        "DROP CONSTRAINT IF EXISTS car_condition_reports_condition_check"
        );
        jdbcTemplate.execute("""
                ALTER TABLE car_condition_reports
                ADD CONSTRAINT car_condition_reports_condition_check
                CHECK (condition IN ('GOOD', 'DAMAGE', 'NEED_MAINTENANCE'))
                """);
        log.info("[CarConditionSchemaReconciler] Car condition values reconciled");
    }
}
