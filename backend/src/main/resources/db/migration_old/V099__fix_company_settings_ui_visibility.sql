-- ============================================================================
-- V099: Fix CompanySettings - Add ui_visibility column if missing
-- ============================================================================
-- Date: 2026-01-03
-- Author: System
-- Description: Ensures ui_visibility column exists in company_settings table
-- ============================================================================

-- Add ui_visibility column if it doesn't exist
-- This handles cases where V002 migration didn't create it properly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
          AND column_name = 'ui_visibility'
    ) THEN
        ALTER TABLE company_settings 
        ADD COLUMN ui_visibility JSONB;
        
        RAISE NOTICE 'Added ui_visibility column to company_settings';
    ELSE
        RAISE NOTICE 'ui_visibility column already exists in company_settings';
    END IF;
END$$;

-- Ensure the column is nullable (safe operation)
ALTER TABLE company_settings 
ALTER COLUMN ui_visibility DROP NOT NULL;

COMMENT ON COLUMN company_settings.ui_visibility IS 
'JSONB configuration for UI feature visibility. Nullable to avoid errors if not configured.';
