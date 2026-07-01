DO $$
BEGIN
    IF to_regclass('public.wallet_transactions') IS NOT NULL THEN
        ALTER TABLE wallet_transactions
        DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

        ALTER TABLE wallet_transactions
        ADD CONSTRAINT wallet_transactions_type_check
        CHECK (type IN (
            'TOP_UP',
            'BOOKING_HOLD',
            'HOLD_RELEASE',
            'FORFEITURE',
            'OVERDUE_CHARGE',
            'DAMAGE_CHARGE',
            'REFUND_CREDIT',
            'WITHDRAWAL_REQUEST',
            'WITHDRAWAL_REVERSED',
            'ADJUSTMENT',
            'DAMAGE_FEE_REFUND'
        ));
    END IF;
END
$$;
