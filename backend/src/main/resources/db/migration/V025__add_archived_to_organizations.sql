-- =============================================================================
-- V108: Add archived column to organizations table
-- =============================================================================
-- Created: 2026-01-07
-- Purpose: Add soft delete support for organizations (especially employers)
-- Impact: Adds 'archived' BOOLEAN column to organizations table
-- Safe: Uses IF NOT EXISTS, DEFAULT FALSE for backward compatibility
-- =============================================================================

-- Add archived column to organizations
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Add helpful comment
COMMENT ON COLUMN organizations.archived IS 'Soft delete flag. Archived organizations are hidden from default lists but remain in database with all relations intact (Members, Benefit Policies, Claims, etc.)';

-- Create index for performance (frequently filtered by archived status)
CREATE INDEX IF NOT EXISTS idx_organizations_archived ON organizations(archived);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_organizations_active_archived ON organizations(active, archived);

-- Add check constraint to ensure data integrity (PostgreSQL-safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_organizations_archived'
          AND table_name = 'organizations'
    ) THEN
        ALTER TABLE organizations
        ADD CONSTRAINT chk_organizations_archived CHECK (archived IN (TRUE, FALSE));
    END IF;
END
$$;

-- =============================================================================
-- MIGRATION VALIDATION
-- =============================================================================
DO $$
BEGIN
    -- Verify column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
          AND column_name = 'archived'
    ) THEN
        RAISE EXCEPTION 'Migration V108 failed: organizations.archived column not created';
    END IF;

    -- Verify index exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'organizations'
          AND indexname = 'idx_organizations_archived'
    ) THEN
        RAISE EXCEPTION 'Migration V108 failed: idx_organizations_archived index not created';
    END IF;

    RAISE NOTICE 'Migration V108 completed successfully: archived column added to organizations table';
END
$$;
