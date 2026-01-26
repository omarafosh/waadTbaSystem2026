-- ═══════════════════════════════════════════════════════════════════════════
-- V050: Add diagnosis columns to Pre-Authorizations
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS diagnosis_code VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS diagnosis_description VARCHAR(500);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) NOT NULL DEFAULT 'OTHER';
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS provider_name VARCHAR(200);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V050
-- ═══════════════════════════════════════════════════════════════════════════
