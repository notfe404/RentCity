DO $$
BEGIN
    IF to_regclass('public.bookings') IS NOT NULL THEN
        ALTER TABLE bookings
        DROP CONSTRAINT IF EXISTS bookings_status_check;

        ALTER TABLE bookings
        ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('PENDING', 'CONFIRMED', 'PAID', 'ONGOING', 'COMPLETED', 'CANCELLED'));
    END IF;

    IF to_regclass('public.booking_status_history') IS NOT NULL THEN
        ALTER TABLE booking_status_history
        DROP CONSTRAINT IF EXISTS booking_status_history_from_status_check;

        ALTER TABLE booking_status_history
        ADD CONSTRAINT booking_status_history_from_status_check
        CHECK (from_status IS NULL OR from_status IN ('PENDING', 'CONFIRMED', 'PAID', 'ONGOING', 'COMPLETED', 'CANCELLED'));

        ALTER TABLE booking_status_history
        DROP CONSTRAINT IF EXISTS booking_status_history_to_status_check;

        ALTER TABLE booking_status_history
        ADD CONSTRAINT booking_status_history_to_status_check
        CHECK (to_status IN ('PENDING', 'CONFIRMED', 'PAID', 'ONGOING', 'COMPLETED', 'CANCELLED'));
    END IF;

    IF to_regclass('public.wallet_transactions') IS NOT NULL THEN
        ALTER TABLE wallet_transactions
        DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

        ALTER TABLE wallet_transactions
        ADD CONSTRAINT wallet_transactions_type_check
        CHECK (type IN (
            'TOP_UP', 'BOOKING_HOLD', 'BALANCE_PAYMENT', 'HOLD_RELEASE', 'FORFEITURE',
            'OVERDUE_CHARGE', 'DAMAGE_CHARGE', 'REFUND_CREDIT', 'WITHDRAWAL_REQUEST',
            'WITHDRAWAL_REVERSED', 'ADJUSTMENT', 'DAMAGE_FEE_REFUND'
        ));
    END IF;

    IF to_regclass('public.bookings') IS NOT NULL
       AND to_regclass('public.payments') IS NOT NULL
       AND to_regclass('public.wallet_transactions') IS NOT NULL
       AND to_regclass('public.booking_status_history') IS NOT NULL THEN

        WITH reconciled AS (
            UPDATE bookings booking
            SET status = 'PAID',
                outstanding_amount = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE booking.status = 'CONFIRMED'
              AND EXISTS (
                  SELECT 1
                  FROM payments payment
                  WHERE payment.booking_id = booking.id
                    AND payment.type = 'BALANCE_PAYMENT'
                    AND payment.status = 'PAID'
              )
              AND COALESCE((
                  SELECT SUM(transaction.amount)
                  FROM wallet_transactions transaction
                  WHERE transaction.booking_id = booking.id
                    AND transaction.type IN ('BALANCE_PAYMENT', 'OVERDUE_CHARGE', 'DAMAGE_CHARGE')
              ), 0) >= GREATEST(booking.total_amount - booking.deposit_amount, 0)
            RETURNING id, user_id
        )
        INSERT INTO booking_status_history (
            booking_id,
            from_status,
            to_status,
            changed_by_user_id,
            changed_by_role,
            reason,
            note,
            created_at
        )
        SELECT
            id,
            'CONFIRMED',
            'PAID',
            user_id,
            'CUSTOMER',
            'BALANCE_PAID_RECONCILED',
            'Reconciled an already-paid pre-handover balance',
            CURRENT_TIMESTAMP
        FROM reconciled;
    END IF;
END
$$;
