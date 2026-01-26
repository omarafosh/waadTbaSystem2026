-- ============================================================================
-- V055: Make claims.insurance_org_id nullable
-- ============================================================================
-- Date: 2026-01-22
-- Description: Insurance company module was removed from the system.
--              The insurance_org_id column is now optional since the system
--              operates without requiring an insurance organization.
-- ============================================================================

-- Make insurance_org_id nullable in claims table
ALTER TABLE claims ALTER COLUMN insurance_org_id DROP NOT NULL;

-- Add comment explaining why it's nullable
COMMENT ON COLUMN claims.insurance_org_id IS 'Optional: Insurance organization reference. Nullable since insurance company module was removed from system.';
