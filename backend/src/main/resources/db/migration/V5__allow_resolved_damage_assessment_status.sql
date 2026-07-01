DO $$
BEGIN
    IF to_regclass('public.damage_assessments') IS NOT NULL THEN
        ALTER TABLE damage_assessments
        DROP CONSTRAINT IF EXISTS damage_assessments_status_check;

        ALTER TABLE damage_assessments
        ADD CONSTRAINT damage_assessments_status_check
        CHECK (status IN (
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'CHARGED',
            'PARTIALLY_CHARGED',
            'RESOLVED'
        ));
    END IF;
END
$$;
