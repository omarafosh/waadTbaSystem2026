-- ═══════════════════════════════════════════════════════════════════════════
-- V054: Add audit columns to Provider Contract Pricing Items
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V054
-- ═══════════════════════════════════════════════════════════════════════════
