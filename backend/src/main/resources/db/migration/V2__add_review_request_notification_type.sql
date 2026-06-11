DO $$
BEGIN
    IF to_regclass('public.notifications') IS NOT NULL THEN
        ALTER TABLE public.notifications
            DROP CONSTRAINT IF EXISTS notifications_type_check;

        ALTER TABLE public.notifications
            ADD CONSTRAINT notifications_type_check
            CHECK (type IN (
                'BOOKING_CREATED',
                'BOOKING_CONFIRMED',
                'BOOKING_CANCELLED',
                'BOOKING_ONGOING',
                'BOOKING_COMPLETED',
                'PAYMENT_PENDING',
                'PAYMENT_PAID',
                'PAYMENT_FAILED',
                'PAYMENT_REFUNDED',
                'PAYMENT_EXPIRED',
                'REVIEW_REQUEST',
                'KYC_PENDING',
                'SYSTEM'
            ));
    END IF;
END
$$;
