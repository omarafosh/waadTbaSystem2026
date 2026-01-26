-- ═══════════════════════════════════════════════════════════════════════════
-- V053: Complete Provider Contract Pricing Items Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS base_price DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS contract_price DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NOT NULL DEFAULT 'service';
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'LYD';
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS effective_from DATE;
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS effective_to DATE;
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS notes VARCHAR(500);
ALTER TABLE provider_contract_pricing_items ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V053
-- ═══════════════════════════════════════════════════════════════════════════
