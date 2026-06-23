ALTER TABLE IF EXISTS car_condition_reports
DROP CONSTRAINT IF EXISTS car_condition_reports_report_type_check;

ALTER TABLE IF EXISTS car_condition_reports
ADD CONSTRAINT car_condition_reports_report_type_check
CHECK (report_type IN ('INITIAL', 'HANDOVER', 'RETURN'));

CREATE TABLE IF NOT EXISTS rental_contracts (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    contract_number VARCHAR(40) NOT NULL UNIQUE,
    policy_version VARCHAR(20) NOT NULL,
    policy_text TEXT NOT NULL,

    handover_condition_report_id BIGINT,
    handover_at TIMESTAMP,
    handover_key_count INTEGER,
    handover_accessories VARCHAR(1000),
    handover_customer_signature VARCHAR(500),
    handover_customer_signed_at TIMESTAMP,
    handover_staff_signature VARCHAR(500),
    handover_staff_user_id BIGINT,
    handover_staff_signed_at TIMESTAMP,

    return_condition_report_id BIGINT,
    return_key_count INTEGER,
    return_accessories VARCHAR(1000),
    return_customer_signature VARCHAR(500),
    return_customer_signed_at TIMESTAMP,
    return_staff_signature VARCHAR(500),
    return_staff_user_id BIGINT,
    return_staff_signed_at TIMESTAMP,

    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_rental_contract_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_rental_contract_handover_condition FOREIGN KEY (handover_condition_report_id) REFERENCES car_condition_reports(id),
    CONSTRAINT fk_rental_contract_return_condition FOREIGN KEY (return_condition_report_id) REFERENCES car_condition_reports(id),
    CONSTRAINT chk_rental_contract_status CHECK (status IN ('HANDOVER_DRAFT', 'ACTIVE', 'RETURN_DRAFT', 'COMPLETED'))
);

CREATE INDEX IF NOT EXISTS idx_rental_contract_status ON rental_contracts(status);
