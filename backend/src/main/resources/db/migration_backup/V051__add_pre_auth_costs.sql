-- ═══════════════════════════════════════════════════════════════════════════
-- V051: Add cost columns to Pre-Authorizations
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(15,2);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(15,2);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V051
-- ═══════════════════════════════════════════════════════════════════════════
