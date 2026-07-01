DO $$
BEGIN
    IF to_regclass('public.bookings') IS NOT NULL THEN
        ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS security_deposit_gateway VARCHAR(20);

        IF to_regclass('public.payments') IS NOT NULL THEN
            UPDATE bookings booking
            SET security_deposit_gateway = (
                SELECT candidate.gateway
                FROM payments candidate
                WHERE candidate.booking_id = booking.id
                  AND candidate.status = 'PAID'
                  AND candidate.type IN ('SECURITY_DEPOSIT', 'BALANCE_PAYMENT')
                ORDER BY CASE WHEN candidate.type = 'SECURITY_DEPOSIT' THEN 0 ELSE 1 END,
                         candidate.paid_at DESC NULLS LAST,
                         candidate.id DESC
                LIMIT 1
            )
            WHERE booking.security_deposit_gateway IS NULL
              AND EXISTS (
                  SELECT 1
                  FROM payments candidate
                  WHERE candidate.booking_id = booking.id
                    AND candidate.status = 'PAID'
                    AND candidate.type IN ('SECURITY_DEPOSIT', 'BALANCE_PAYMENT')
              );
        END IF;

        UPDATE bookings
        SET security_deposit_gateway = 'CASH'
        WHERE security_deposit_collection_method = 'CASH'
          AND security_deposit_gateway IS NULL;
    END IF;

    IF to_regclass('public.rental_contracts') IS NOT NULL THEN
        ALTER TABLE rental_contracts
            ADD COLUMN IF NOT EXISTS security_deposit_gateway VARCHAR(20);

        IF to_regclass('public.bookings') IS NOT NULL THEN
            UPDATE rental_contracts contract
            SET security_deposit_gateway = booking.security_deposit_gateway
            FROM bookings booking
            WHERE contract.booking_id = booking.id
              AND contract.security_deposit_gateway IS NULL;
        END IF;
    END IF;
END
$$;
