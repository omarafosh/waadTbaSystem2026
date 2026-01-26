-- ═══════════════════════════════════════════════════════════════════════════
-- V023: Add Missing Columns to chronic_conditions Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add columns required by ChronicCondition JPA Entity
-- Fixes: Schema-validation: missing column [associated_service_codes] in table [chronic_conditions]
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add associated_service_codes column
ALTER TABLE chronic_conditions ADD COLUMN IF NOT EXISTS associated_service_codes VARCHAR(2000);

-- 2. Add requires_pre_approval column (if not exists)
ALTER TABLE chronic_conditions ADD COLUMN IF NOT EXISTS requires_pre_approval BOOLEAN DEFAULT TRUE;

-- 3. Add notes column (if not exists)
ALTER TABLE chronic_conditions ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V023
-- ═══════════════════════════════════════════════════════════════════════════
