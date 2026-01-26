-- ═══════════════════════════════════════════════════════════════════════════
-- V041: Add Missing Module Access Columns
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE module_access ADD COLUMN IF NOT EXISTS allowed_roles JSON NOT NULL DEFAULT '[]';
ALTER TABLE module_access ADD COLUMN IF NOT EXISTS required_permissions JSON;
ALTER TABLE module_access ADD COLUMN IF NOT EXISTS feature_flag_key VARCHAR(100);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V041
-- ═══════════════════════════════════════════════════════════════════════════
