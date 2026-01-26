-- ========================================
-- V202: Phase 1 Financial Lifecycle - Optimistic Locking
-- ========================================
-- PURPOSE: Add version column to claims table for race condition protection
-- DATE: 2026-01-11
-- PHASE: 1 - Financial Lifecycle Completion
-- ========================================

-- BUSINESS REQUIREMENT:
-- Prevent concurrent modifications to claims that could cause:
-- - Double deduction from member's balance
-- - Inconsistent financial calculations
-- - Duplicate approvals

-- Add version column for optimistic locking
ALTER TABLE claims 
  ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN claims.version IS 
  'Optimistic locking version (PHASE 1). Prevents concurrent modifications. Incremented automatically by JPA on each update. Critical for financial integrity to prevent race conditions in claim approvals.';

-- Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_claims_version 
  ON claims(version);

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'claims' 
        AND column_name = 'version'
    ) THEN
        RAISE EXCEPTION 'Version column was not created successfully';
    END IF;
    
    RAISE NOTICE '✅ Version column created successfully on claims table';
END $$;
