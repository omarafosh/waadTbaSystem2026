-- ═══════════════════════════════════════════════════════════════════════════
-- V040: Fix Members Column Types
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Convert eligibility_status from VARCHAR to BOOLEAN
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the index first
DROP INDEX IF EXISTS idx_members_eligibility;

-- Add temporary column
ALTER TABLE members ADD COLUMN eligibility_status_bool BOOLEAN DEFAULT TRUE;

-- Copy data with conversion
UPDATE members SET eligibility_status_bool = CASE
    WHEN eligibility_status IS NULL THEN TRUE
    WHEN LOWER(eligibility_status) IN ('true', 'active', 'eligible', '1', 'yes') THEN TRUE
    ELSE FALSE
END;

-- Drop old column
ALTER TABLE members DROP COLUMN eligibility_status;

-- Rename new column
ALTER TABLE members RENAME COLUMN eligibility_status_bool TO eligibility_status;

-- Recreate index on boolean column
CREATE INDEX idx_members_eligibility ON members(eligibility_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V040
-- ═══════════════════════════════════════════════════════════════════════════
