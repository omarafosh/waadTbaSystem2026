-- ============================================================================
-- Migration: Add is_default column to companies table
-- Version: V022
-- Date: 2025-01-02
-- Purpose: Support single-company context mode
-- ============================================================================
-- 
-- This migration adds the is_default column to support identifying the
-- system's default company without relying on hardcoded codes.
--
-- Single Company Context Philosophy:
-- - System operates with exactly one TPA company
-- - Company selection is implicit, not explicit
-- - Eliminates entire class of user errors
-- - Simplifies architecture
--
-- ============================================================================

-- Add is_default column
ALTER TABLE companies 
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance
CREATE INDEX idx_companies_is_default ON companies(is_default) WHERE is_default = true;

-- Set TBA company as default (if exists)
UPDATE companies 
SET is_default = true 
WHERE code = 'TBA';

-- If TBA doesn't exist, set first company as default
UPDATE companies 
SET is_default = true 
WHERE id = (
    SELECT id FROM companies 
    WHERE is_default = false 
    ORDER BY id ASC 
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 FROM companies WHERE is_default = true
);

-- Add comment for documentation
COMMENT ON COLUMN companies.is_default IS 
'Indicates the default/primary company for single-company mode. Only one company should have this set to true.';

-- Verify exactly one default exists
DO $$
DECLARE
    default_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO default_count FROM companies WHERE is_default = true;
    
    IF default_count = 0 THEN
        RAISE WARNING 'No default company found. System may not function correctly.';
    ELSIF default_count > 1 THEN
        RAISE WARNING 'Multiple default companies found (%). Only one should be default.', default_count;
    ELSE
        RAISE NOTICE 'Default company configured successfully.';
    END IF;
END $$;
