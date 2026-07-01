DO $$
BEGIN
    IF to_regclass('public.bookings') IS NOT NULL THEN
        ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS insurance_selected BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS child_seat_quantity INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS gps_selected BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS extra_services_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS delivery_fee_amount NUMERIC(12, 0) NOT NULL DEFAULT 0;

        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_child_seat_quantity_check;
        ALTER TABLE bookings ADD CONSTRAINT bookings_child_seat_quantity_check
            CHECK (child_seat_quantity >= 0);

        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_extra_services_amount_check;
        ALTER TABLE bookings ADD CONSTRAINT bookings_extra_services_amount_check
            CHECK (extra_services_amount >= 0);

        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_delivery_fee_amount_check;
        ALTER TABLE bookings ADD CONSTRAINT bookings_delivery_fee_amount_check
            CHECK (delivery_fee_amount >= 0);
    END IF;
END
$$;
