-- =============================================================================
-- V102: ENTERPRISE BENEFIT PLAN RULES & PROVIDER PARTNERSHIPS
-- =============================================================================
-- 1. Partnership Table (Requirement 4)
-- Provider-Company Partnership Control
-- =============================================================================

CREATE TABLE IF NOT EXISTS provider_insurance_partnerships (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES organizations(id),
    insurance_org_id BIGINT NOT NULL REFERENCES organizations(id),
    active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, insurance_org_id)
);

COMMENT ON TABLE provider_insurance_partnerships IS 'Requirement 4: Rules defining which insurance companies each medical provider works with';

-- 2. Enhanced Benefit Policy Rules (Requirement 3)
-- Rule defined by: Benefit Plan + Category + Service (composite)
-- =============================================================================

-- Remove old unique constraints to allow composite rules
ALTER TABLE benefit_policy_rules DROP CONSTRAINT IF EXISTS benefit_policy_rules_benefit_policy_id_medical_category_id_key;
ALTER TABLE benefit_policy_rules DROP CONSTRAINT IF EXISTS benefit_policy_rules_benefit_policy_id_medical_service_id_key;

-- Add new composite unique constraint
-- This allows:
-- - Rule for Category (Service is NULL)
-- - Rule for Service (Category is NULL)
-- - Specific Rule for Service UNDER Category
ALTER TABLE benefit_policy_rules 
    ADD CONSTRAINT uq_benefit_plan_category_service 
    UNIQUE (benefit_policy_id, medical_category_id, medical_service_id);

-- Add missing fields for enterprise plans
ALTER TABLE benefit_policy_rules 
    ADD COLUMN IF NOT EXISTS annual_limit DECIMAL(15, 2),
    ADD COLUMN IF NOT EXISTS visit_limit INTEGER,
    ADD COLUMN IF NOT EXISTS copayment_amount DECIMAL(15, 2),
    ADD COLUMN IF NOT EXISTS co_payment_percentage DECIMAL(5, 2), -- Existing coverage_percent is similar but co-pay is often more descriptive
    ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN benefit_policy_rules.is_excluded IS 'If true, this service/category is explicitly EXCLUDED from the plan';

-- 3. Pricing Source: provider_service_prices (Requirement 7)
-- Prices are NOT in benefit plans, but in specific provider price lists.
-- (Currently we have provider_contract_pricing_items, which matches this req).
-- I will add a view or explicit table if needed, but for now V003 matches this.
