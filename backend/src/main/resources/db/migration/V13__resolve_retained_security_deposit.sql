DO $$
BEGIN
    IF to_regclass('public.bookings') IS NOT NULL THEN
        ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS security_deposit_repair_cost NUMERIC(12, 0),
            ADD COLUMN IF NOT EXISTS security_deposit_refunded_amount NUMERIC(12, 0) NOT NULL DEFAULT 0;

        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_security_deposit_repair_cost_check;
        ALTER TABLE bookings ADD CONSTRAINT bookings_security_deposit_repair_cost_check
            CHECK (security_deposit_repair_cost IS NULL OR security_deposit_repair_cost >= 0);

        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_security_deposit_refunded_amount_check;
        ALTER TABLE bookings ADD CONSTRAINT bookings_security_deposit_refunded_amount_check
            CHECK (security_deposit_refunded_amount >= 0 AND security_deposit_refunded_amount <= security_deposit_amount);
    END IF;

    IF to_regclass('public.rental_contracts') IS NOT NULL THEN
        ALTER TABLE rental_contracts
            ADD COLUMN IF NOT EXISTS security_deposit_repair_cost NUMERIC(12, 0),
            ADD COLUMN IF NOT EXISTS security_deposit_refunded_amount NUMERIC(12, 0) NOT NULL DEFAULT 0;
    END IF;
END
$$;
