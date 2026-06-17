package com.rentcity.Rentcity.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class PaymentSchemaReconciler implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute(
                "ALTER TABLE IF EXISTS payments ALTER COLUMN booking_id DROP NOT NULL"
        );
        jdbcTemplate.execute(
                "ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_type_check"
        );
        jdbcTemplate.execute(
                "ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_gateway_check"
        );
        jdbcTemplate.execute("""
                ALTER TABLE payments
                ADD CONSTRAINT payments_type_check
                CHECK (type IN ('DEPOSIT', 'WALLET_TOP_UP', 'DAMAGE_PAYMENT', 'BALANCE_PAYMENT', 'EXTRA_CHARGE', 'FULL', 'REFUND'))
                """);
        jdbcTemplate.execute("""
                ALTER TABLE payments
                ADD CONSTRAINT payments_gateway_check
                CHECK (gateway IN ('PAYPAL', 'VNPAY', 'CASH', 'WALLET'))
                """);
        log.info("[PaymentSchemaReconciler] Payment types and gateways reconciled");
    }
}
