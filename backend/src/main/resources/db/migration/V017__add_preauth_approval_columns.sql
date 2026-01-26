-- =====================================================
-- Add Missing Columns to Pre-Authorizations
-- Version: V020
-- Date: 2026-01-01
-- Purpose: Add approved_at and approved_by columns
-- =====================================================

-- Add approved_at column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'approved_at') THEN
        ALTER TABLE pre_authorizations ADD COLUMN approved_at TIMESTAMP;
        RAISE NOTICE 'pre_authorizations: Added approved_at column';
    ELSE
        RAISE NOTICE 'pre_authorizations: approved_at column already exists';
    END IF;
END $$;

-- Add approved_by column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'approved_by') THEN
        ALTER TABLE pre_authorizations ADD COLUMN approved_by VARCHAR(100);
        RAISE NOTICE 'pre_authorizations: Added approved_by column';
    ELSE
        RAISE NOTICE 'pre_authorizations: approved_by column already exists';
    END IF;
END $$;

-- Update comments
COMMENT ON COLUMN pre_authorizations.approved_at IS 'Timestamp when pre-authorization was approved';
COMMENT ON COLUMN pre_authorizations.approved_by IS 'Username or ID of approver';

-- Validation
DO $$
DECLARE
    v_approved_at_exists BOOLEAN;
    v_approved_by_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pre_authorizations' AND column_name = 'approved_at'
    ) INTO v_approved_at_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pre_authorizations' AND column_name = 'approved_by'
    ) INTO v_approved_by_exists;
    
    IF NOT (v_approved_at_exists AND v_approved_by_exists) THEN
        RAISE EXCEPTION 'V020 migration failed: Missing columns in pre_authorizations';
    END IF;
    
    RAISE NOTICE '✓ V020 validation passed: All pre_authorizations columns present';
END $$;
