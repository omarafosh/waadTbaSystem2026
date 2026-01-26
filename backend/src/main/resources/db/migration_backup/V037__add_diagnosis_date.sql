-- ═══════════════════════════════════════════════════════════════════════════
-- V037: Add diagnosis_date to Member Chronic Conditions
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS diagnosis_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Remove the default after adding
ALTER TABLE member_chronic_conditions ALTER COLUMN diagnosis_date DROP DEFAULT;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V037
-- ═══════════════════════════════════════════════════════════════════════════
