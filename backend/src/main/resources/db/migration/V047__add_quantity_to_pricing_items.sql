-- ============================================================================
-- V047: Add quantity column to provider_contract_pricing_items
-- ============================================================================
-- Issue: Entity has @Column(name = "quantity") but column doesn't exist in DB
-- Error: "column pi1_0.quantity does not exist"
-- Solution: Add the missing quantity column
-- ============================================================================

-- Add quantity column to provider_contract_pricing_items
ALTER TABLE provider_contract_pricing_items 
    ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;

-- Also add service_name column if missing (used for imported items without medical_service link)
ALTER TABLE provider_contract_pricing_items 
    ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);

-- Make medical_service_id nullable (for imported items that use service_name instead)
ALTER TABLE provider_contract_pricing_items 
    ALTER COLUMN medical_service_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN provider_contract_pricing_items.quantity IS 'Quantity for imported pricing items (default 0)';
COMMENT ON COLUMN provider_contract_pricing_items.service_name IS 'Service name for imported items without medical_service link';
