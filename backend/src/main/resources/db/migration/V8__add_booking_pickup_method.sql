DO $$
BEGIN
    IF to_regclass('public.bookings') IS NOT NULL THEN
        ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS pickup_method VARCHAR(30) NOT NULL DEFAULT 'BRANCH_PICKUP',
            ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);

        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_pickup_method_check;
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_pickup_method_check
                CHECK (pickup_method IN ('BRANCH_PICKUP', 'ADDRESS_DELIVERY'));

        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_delivery_address_check;
        ALTER TABLE bookings
            ADD CONSTRAINT bookings_delivery_address_check
                CHECK (
                    (pickup_method = 'BRANCH_PICKUP' AND delivery_address IS NULL)
                    OR (pickup_method = 'ADDRESS_DELIVERY' AND NULLIF(BTRIM(delivery_address), '') IS NOT NULL)
                );
    END IF;
END
$$;
