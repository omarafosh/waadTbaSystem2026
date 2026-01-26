-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration V203: SLA Tracking Implementation
-- ═══════════════════════════════════════════════════════════════════════════════
-- Author: Phase 1 - Financial Gaps Closure
-- Date: 2026-01-11
-- Description: Add SLA tracking fields to claims table and create system_settings table

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: Create system_settings table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'STRING',
    description TEXT,
    category VARCHAR(50),
    is_editable BOOLEAN NOT NULL DEFAULT TRUE,
    default_value TEXT,
    validation_rules TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    
    CONSTRAINT uk_setting_key UNIQUE (setting_key)
);

-- Create index for category-based queries
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON system_settings(active);

-- Add comment for documentation
COMMENT ON TABLE system_settings IS 
  'System-wide configurable settings (Phase 1: SLA Implementation)';

COMMENT ON COLUMN system_settings.setting_key IS 
  'Unique setting key (e.g., CLAIM_SLA_DAYS)';

COMMENT ON COLUMN system_settings.value_type IS 
  'Data type: INTEGER, DECIMAL, BOOLEAN, STRING, JSON';

-- Insert default CLAIM_SLA_DAYS setting
INSERT INTO system_settings (
    setting_key, 
    setting_value, 
    value_type, 
    description, 
    category, 
    is_editable, 
    default_value,
    validation_rules,
    active
) VALUES (
    'CLAIM_SLA_DAYS',
    '10',
    'INTEGER',
    'Number of business days allowed for claim processing (SLA)',
    'CLAIMS',
    TRUE,
    '10',
    'min:1,max:30',
    TRUE
)
ON CONFLICT (setting_key) DO NOTHING;  -- Skip if already exists

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: Add SLA tracking columns to claims table
-- ═══════════════════════════════════════════════════════════════════════════════

-- Expected completion date (calculated from submission + SLA days)
ALTER TABLE claims 
  ADD COLUMN IF NOT EXISTS expected_completion_date DATE;

-- Actual completion date (when approved/rejected)
ALTER TABLE claims 
  ADD COLUMN IF NOT EXISTS actual_completion_date DATE;

-- Whether claim was completed within SLA
ALTER TABLE claims 
  ADD COLUMN IF NOT EXISTS within_sla BOOLEAN;

-- Number of business days taken to complete
ALTER TABLE claims 
  ADD COLUMN IF NOT EXISTS business_days_taken INTEGER;

-- SLA days configured at submission time (snapshot)
ALTER TABLE claims 
  ADD COLUMN IF NOT EXISTS sla_days_configured INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN claims.expected_completion_date IS 
  'Expected completion date (submission + SLA business days). Phase 1: SLA Implementation';

COMMENT ON COLUMN claims.actual_completion_date IS 
  'Actual completion date (when approved/rejected). Phase 1: SLA Implementation';

COMMENT ON COLUMN claims.within_sla IS 
  'Whether claim was completed within SLA (business_days_taken <= sla_days_configured). Phase 1: SLA Implementation';

COMMENT ON COLUMN claims.business_days_taken IS 
  'Number of business days taken to process claim. Phase 1: SLA Implementation';

COMMENT ON COLUMN claims.sla_days_configured IS 
  'SLA days configured at submission time (snapshot). Phase 1: SLA Implementation';

-- Create indexes for SLA queries
CREATE INDEX IF NOT EXISTS idx_claims_expected_completion_date 
  ON claims(expected_completion_date) 
  WHERE active = true AND status = 'UNDER_REVIEW';

CREATE INDEX IF NOT EXISTS idx_claims_within_sla 
  ON claims(within_sla) 
  WHERE active = true AND within_sla IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_claims_sla_monitoring 
  ON claims(status, expected_completion_date, active) 
  WHERE active = true AND status IN ('SUBMITTED', 'UNDER_REVIEW');

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (for manual testing)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify system_settings table exists and has default setting
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM system_settings 
        WHERE setting_key = 'CLAIM_SLA_DAYS' AND setting_value = '10'
    ) THEN
        RAISE NOTICE '✅ system_settings table created and CLAIM_SLA_DAYS initialized';
    ELSE
        RAISE WARNING '⚠️ CLAIM_SLA_DAYS setting not found or has unexpected value';
    END IF;
END $$;

-- Verify claims table has new SLA columns
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'claims'
    AND column_name IN (
        'expected_completion_date',
        'actual_completion_date',
        'within_sla',
        'business_days_taken',
        'sla_days_configured'
    );
    
    IF column_count = 5 THEN
        RAISE NOTICE '✅ All 5 SLA columns added to claims table';
    ELSE
        RAISE WARNING '⚠️ Expected 5 SLA columns, found %', column_count;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROLLBACK SCRIPT (for reference - do not execute unless reverting migration)
-- ═══════════════════════════════════════════════════════════════════════════════

/*
-- Rollback SLA columns from claims table
ALTER TABLE claims DROP COLUMN IF EXISTS expected_completion_date;
ALTER TABLE claims DROP COLUMN IF EXISTS actual_completion_date;
ALTER TABLE claims DROP COLUMN IF EXISTS within_sla;
ALTER TABLE claims DROP COLUMN IF EXISTS business_days_taken;
ALTER TABLE claims DROP COLUMN IF EXISTS sla_days_configured;

-- Rollback system_settings table
DROP TABLE IF EXISTS system_settings CASCADE;
*/
