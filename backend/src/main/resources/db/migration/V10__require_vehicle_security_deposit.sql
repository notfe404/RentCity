DO $$
BEGIN
    IF to_regclass('public.cars') IS NOT NULL THEN
        ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_deposit_positive_check;
        ALTER TABLE cars ADD CONSTRAINT cars_deposit_positive_check
            CHECK (deposit IS NOT NULL AND deposit > 0);
    END IF;

    IF to_regclass('public.payments') IS NOT NULL THEN
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
        ALTER TABLE payments ADD CONSTRAINT payments_type_check CHECK (type IN (
            'DEPOSIT', 'SECURITY_DEPOSIT', 'SECURITY_DEPOSIT_REFUND', 'FINAL_RENTAL_PAYMENT',
            'WALLET_TOP_UP', 'DAMAGE_PAYMENT', 'BALANCE_PAYMENT', 'EXTRA_CHARGE', 'FULL', 'REFUND'
        ));
    END IF;
END
$$;
