-- ═══════════════════════════════════════════════════════════════════════════
-- V035: Add price_lyd to Medical Services
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS price_lyd DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V035
-- ═══════════════════════════════════════════════════════════════════════════
