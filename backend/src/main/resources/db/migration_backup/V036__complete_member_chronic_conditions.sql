-- ═══════════════════════════════════════════════════════════════════════════
-- V036: Complete Member Chronic Conditions Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

-- Add missing columns to member_chronic_conditions
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS attachments VARCHAR(1000);
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS extra_limit DECIMAL(15,2);
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS extra_limit_used DECIMAL(15,2) DEFAULT 0;
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS valid_from DATE;
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS requires_mandatory_pre_approval BOOLEAN NOT NULL DEFAULT FALSE;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V036
-- ═══════════════════════════════════════════════════════════════════════════
