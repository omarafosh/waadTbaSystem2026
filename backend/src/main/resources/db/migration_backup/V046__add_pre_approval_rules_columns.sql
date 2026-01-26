-- ═══════════════════════════════════════════════════════════════════════════
-- V046: Add service_code and rule_name to Pre-Approval Rules
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS service_code VARCHAR(100);
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS rule_name VARCHAR(200) NOT NULL DEFAULT 'Unnamed Rule';
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS description VARCHAR(1000);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V046
-- ═══════════════════════════════════════════════════════════════════════════
