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
public class WalletSchemaReconciler implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute(
                "ALTER TABLE IF EXISTS wallet_transactions " +
                        "DROP CONSTRAINT IF EXISTS wallet_transactions_type_check"
        );
        jdbcTemplate.execute("""
                ALTER TABLE wallet_transactions
                ADD CONSTRAINT wallet_transactions_type_check
                CHECK (type IN (
                    'TOP_UP', 'BOOKING_HOLD', 'HOLD_RELEASE', 'FORFEITURE',
                    'OVERDUE_CHARGE', 'DAMAGE_CHARGE', 'REFUND_CREDIT',
                    'WITHDRAWAL_REQUEST', 'WITHDRAWAL_REVERSED', 'ADJUSTMENT',
                    'DAMAGE_FEE_REFUND'
                ))
                """);
        log.info("[WalletSchemaReconciler] Wallet transaction values reconciled");
    }
}
