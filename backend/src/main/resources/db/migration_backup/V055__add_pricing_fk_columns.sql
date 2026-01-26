-- ═══════════════════════════════════════════════════════════════════════════
-- V055: Add FK columns to Provider Contract Pricing Items
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS medical_category_id BIGINT;
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS medical_service_id BIGINT NOT NULL DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V055
-- ═══════════════════════════════════════════════════════════════════════════
