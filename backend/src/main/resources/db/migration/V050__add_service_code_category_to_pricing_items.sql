-- ═══════════════════════════════════════════════════════════════════════════════
-- V050: Add service_code and category_name to provider_contract_pricing_items
-- ═══════════════════════════════════════════════════════════════════════════════
-- Date: 2026-01-17
-- Purpose: Add optional columns for service code and category name
--          for better organization of imported pricing items
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add service_code column (optional, for reference/lookup)
ALTER TABLE provider_contract_pricing_items
ADD COLUMN IF NOT EXISTS service_code VARCHAR(50);

-- Add category_name column (optional, for display/grouping)
ALTER TABLE provider_contract_pricing_items
ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);

-- Create index for service_code lookup
CREATE INDEX IF NOT EXISTS idx_pricing_service_code 
ON provider_contract_pricing_items(service_code) 
WHERE service_code IS NOT NULL;

-- Create index for category_name filtering
CREATE INDEX IF NOT EXISTS idx_pricing_category_name 
ON provider_contract_pricing_items(category_name) 
WHERE category_name IS NOT NULL;

-- Add comment
COMMENT ON COLUMN provider_contract_pricing_items.service_code IS 'Optional service code for reference and lookup';
COMMENT ON COLUMN provider_contract_pricing_items.category_name IS 'Optional category name for display and grouping';
