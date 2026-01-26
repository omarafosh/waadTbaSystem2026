-- ═══════════════════════════════════════════════════════════════════════════
-- V045: Complete Pre-Approval Rules Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Add all missing columns to match Entity

ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS allow_auto_approval BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS auto_approval_conditions VARCHAR(2000);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS chronic_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS chronic_condition_id BIGINT;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS service_description VARCHAR(500);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS provider_type VARCHAR(30);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS min_amount DECIMAL(15,2);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS max_auto_approve_amount DECIMAL(15,2);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS requires_manager_review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS required_approval_level VARCHAR(20);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 30;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS notes VARCHAR(2000);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V045
-- ═══════════════════════════════════════════════════════════════════════════
