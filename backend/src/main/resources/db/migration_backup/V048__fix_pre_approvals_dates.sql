-- ═══════════════════════════════════════════════════════════════════════════
-- V048: Fix Pre-Approvals Date Column Types
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Entity expects DATE but DB has TIMESTAMP

ALTER TABLE pre_approvals ALTER COLUMN request_date TYPE DATE USING request_date::DATE;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V048
-- ═══════════════════════════════════════════════════════════════════════════
