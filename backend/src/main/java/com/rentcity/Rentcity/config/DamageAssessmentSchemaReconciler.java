package com.rentcity.Rentcity.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class DamageAssessmentSchemaReconciler implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute(
                "ALTER TABLE IF EXISTS damage_assessments " +
                        "DROP CONSTRAINT IF EXISTS damage_assessments_status_check"
        );
        jdbcTemplate.execute("""
                ALTER TABLE damage_assessments
                ADD CONSTRAINT damage_assessments_status_check
                CHECK (status IN (
                    'PENDING_APPROVAL', 'APPROVED', 'REJECTED',
                    'CHARGED', 'PARTIALLY_CHARGED', 'RESOLVED'
                ))
                """);
        log.info("[DamageAssessmentSchemaReconciler] Damage assessment statuses reconciled");
    }
}
