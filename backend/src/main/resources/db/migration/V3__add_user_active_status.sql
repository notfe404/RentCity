DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL THEN
        ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
    END IF;
END
$$;
