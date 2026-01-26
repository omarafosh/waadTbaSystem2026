DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pre_authorizations' 
          AND column_name = 'visit_id'
    ) THEN
        ALTER TABLE pre_authorizations 
        ADD COLUMN visit_id BIGINT;
        COMMENT ON COLUMN pre_authorizations.visit_id IS 'ربط الموافقة المسبقة بالزيارة';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_preauth_visit ON pre_authorizations(visit_id);
