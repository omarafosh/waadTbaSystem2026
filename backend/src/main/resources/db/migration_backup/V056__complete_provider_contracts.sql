-- ═══════════════════════════════════════════════════════════════════════════
-- V056: Complete Provider Contracts Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(5,2);
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS contract_code VARCHAR(50);
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS signed_date DATE;
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS total_value DECIMAL(15,2);
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'LYD';
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(500);
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200);
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200);
ALTER TABLE provider_contracts ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(50) DEFAULT 'DISCOUNT';

-- ═══════════════════════════════════════════════════════════════════════════
-- END V056
-- ═══════════════════════════════════════════════════════════════════════════
