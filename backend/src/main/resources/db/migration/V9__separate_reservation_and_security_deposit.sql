ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS security_deposit_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS security_deposit_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    ADD COLUMN IF NOT EXISTS security_deposit_paid_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS security_deposit_collection_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS security_deposit_paid_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS security_deposit_refund_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS security_deposit_resolved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS final_rental_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS final_payment_status VARCHAR(30) NOT NULL DEFAULT 'NOT_DUE',
    ADD COLUMN IF NOT EXISTS final_payment_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMP;

UPDATE bookings booking
SET security_deposit_amount = COALESCE(car.deposit, 0)
FROM cars car
WHERE booking.car_id = car.id
  AND booking.security_deposit_amount = 0;

UPDATE bookings
SET security_deposit_status = 'PAID',
    security_deposit_paid_amount = security_deposit_amount,
    security_deposit_collection_method = 'PAYMENT_REQUEST',
    security_deposit_paid_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE status IN ('PAID', 'ONGOING', 'COMPLETED')
  AND security_deposit_status = 'UNPAID';

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_security_deposit_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_security_deposit_status_check
    CHECK (security_deposit_status IN ('UNPAID', 'PAYMENT_REQUESTED', 'PAID', 'RETAINED', 'REFUNDED'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_security_deposit_collection_method_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_security_deposit_collection_method_check
    CHECK (security_deposit_collection_method IS NULL OR security_deposit_collection_method IN ('PAYMENT_REQUEST', 'CASH'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_security_deposit_refund_method_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_security_deposit_refund_method_check
    CHECK (security_deposit_refund_method IS NULL OR security_deposit_refund_method IN ('PAYMENT_REQUEST', 'CASH'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_final_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_final_payment_status_check
    CHECK (final_payment_status IN ('NOT_DUE', 'PAYMENT_REQUESTED', 'PAID'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_final_payment_method_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_final_payment_method_check
    CHECK (final_payment_method IS NULL OR final_payment_method IN ('PAYMENT_REQUEST', 'CASH'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_type_check CHECK (type IN (
    'DEPOSIT', 'SECURITY_DEPOSIT', 'SECURITY_DEPOSIT_REFUND', 'FINAL_RENTAL_PAYMENT',
    'WALLET_TOP_UP', 'DAMAGE_PAYMENT', 'BALANCE_PAYMENT', 'EXTRA_CHARGE', 'FULL', 'REFUND'
));

ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_type_check CHECK (type IN (
    'TOP_UP', 'BOOKING_HOLD', 'BALANCE_PAYMENT', 'HOLD_RELEASE', 'FORFEITURE',
    'OVERDUE_CHARGE', 'DAMAGE_CHARGE', 'REFUND_CREDIT', 'WITHDRAWAL_REQUEST',
    'WITHDRAWAL_REVERSED', 'ADJUSTMENT', 'DAMAGE_FEE_REFUND', 'RESERVATION_FEE',
    'SECURITY_DEPOSIT_CASH_REFUND', 'SECURITY_DEPOSIT_RETAINED', 'FINAL_RENTAL_PAYMENT'
));

ALTER TABLE rental_contracts
    ADD COLUMN IF NOT EXISTS security_deposit_amount NUMERIC(12, 0),
    ADD COLUMN IF NOT EXISTS security_deposit_collection_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS security_deposit_paid_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS security_deposit_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS security_deposit_refund_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS security_deposit_resolved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS final_rental_amount NUMERIC(12, 0),
    ADD COLUMN IF NOT EXISTS final_payment_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS final_payment_status VARCHAR(30);
