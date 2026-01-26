-- ══════════════════════════════════════════════════════════════════════════════
-- V056: Architecture Enforcement Migration
-- ══════════════════════════════════════════════════════════════════════════════
-- Purpose: Enforce architectural rules discovered in system audit
-- Date: 2026-01-22
-- Author: System Architect
-- 
-- ARCHITECTURAL RULES ENFORCED:
-- 1. MedicalService MUST belong to a MedicalCategory
-- 2. PreAuthorization gains reservedAmount for limit tracking
-- 3. Deprecated fields are marked for future removal
-- ══════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- 1. PREAUTHORIZATION: Add reservedAmount for limit tracking
-- ════════════════════════════════════════════════════════════════════════════
-- This field tracks the amount "reserved" when a PreAuth is approved
-- It does NOT deduct from the limit - only Claim Approval does that
-- Used to warn about potential over-commitment

ALTER TABLE pre_authorizations 
ADD COLUMN IF NOT EXISTS reserved_amount DECIMAL(15,2) DEFAULT 0.00;

-- Add index for efficient limit queries
CREATE INDEX IF NOT EXISTS idx_preauth_reserved_amount 
ON pre_authorizations(member_id, status, reserved_amount) 
WHERE status = 'APPROVED';

COMMENT ON COLUMN pre_authorizations.reserved_amount IS 
'Amount reserved for limit tracking. Does NOT deduct from limit - only Claim Approval does that. Used for warning about potential over-commitment.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. MEDICAL SERVICES: Ensure all services have a category
-- ════════════════════════════════════════════════════════════════════════════
-- First, create a default category if needed for migration purposes
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
SELECT 'CAT-UNCATEGORIZED', 'غير مصنف', 'Uncategorized', NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = 'CAT-UNCATEGORIZED');

-- Update any services without a category to use the uncategorized category
UPDATE medical_services 
SET category_id = (SELECT id FROM medical_categories WHERE code = 'CAT-UNCATEGORIZED')
WHERE category_id IS NULL;

-- Now add NOT NULL constraint (safe because we just filled all nulls)
-- Note: We'll do this through entity validation rather than DB constraint
-- to provide better error messages

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_medical_service_category'
        AND table_name = 'medical_services'
    ) THEN
        ALTER TABLE medical_services
        ADD CONSTRAINT fk_medical_service_category
        FOREIGN KEY (category_id) REFERENCES medical_categories(id);
    END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. BENEFIT POLICY RULES: Add constraint to ensure rule has target
-- ════════════════════════════════════════════════════════════════════════════
-- A rule must have either medical_service_id OR medical_category_id (not both null)

-- Add check constraint (PostgreSQL syntax)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_rule_has_target'
    ) THEN
        ALTER TABLE benefit_policy_rules 
        ADD CONSTRAINT chk_rule_has_target 
        CHECK (medical_service_id IS NOT NULL OR medical_category_id IS NOT NULL);
    END IF;
END $$;

COMMENT ON TABLE benefit_policy_rules IS 
'Coverage rules for benefit policies. Each rule MUST target either a MedicalService OR a MedicalCategory.';

-- ════════════════════════════════════════════════════════════════════════════
-- 4. CLAIMS: Ensure audit trail has all required fields
-- ════════════════════════════════════════════════════════════════════════════
-- Add column to track when limit was checked
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS limit_checked_at TIMESTAMP;

ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS limit_remaining_at_approval DECIMAL(15,2);

COMMENT ON COLUMN claims.limit_checked_at IS 
'Timestamp when the annual limit was validated during approval';

COMMENT ON COLUMN claims.limit_remaining_at_approval IS 
'Remaining limit at the time of approval (for audit purposes)';

-- ════════════════════════════════════════════════════════════════════════════
-- 5. ADD DOCUMENTATION COMMENTS FOR DEPRECATED FIELDS
-- ════════════════════════════════════════════════════════════════════════════

-- Mark basePrice as reference-only
COMMENT ON COLUMN medical_services.base_price IS 
'[REFERENCE ONLY] Base price for estimation and reporting. Actual price comes from ProviderContract.contractPrice';

-- Mark discountRate as legacy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'provider_contracts' AND column_name = 'discount_rate') THEN
        COMMENT ON COLUMN provider_contracts.discount_rate IS 
        '[DEPRECATED] Use ProviderContractPricingItem.discountPercent instead';
    END IF;
END $$;

-- Mark totalValue as unused
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'provider_contracts' AND column_name = 'total_value') THEN
        COMMENT ON COLUMN provider_contracts.total_value IS 
        '[DEPRECATED] Not used in calculations. Will be removed in future version.';
    END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. CREATE VIEW FOR COVERAGE RESOLUTION (DEBUGGING/REPORTING)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_coverage_resolution AS
SELECT 
    bp.id AS policy_id,
    bp.name AS policy_name,
    ms.id AS service_id,
    ms.code AS service_code,
    ms.name_ar AS service_name,
    mc.id AS category_id,
    mc.code AS category_code,
    mc.name_ar AS category_name,
    COALESCE(
        (SELECT bpr.coverage_percent FROM benefit_policy_rules bpr 
         WHERE bpr.benefit_policy_id = bp.id AND bpr.medical_service_id = ms.id AND bpr.active = true
         LIMIT 1),
        (SELECT bpr.coverage_percent FROM benefit_policy_rules bpr 
         WHERE bpr.benefit_policy_id = bp.id AND bpr.medical_category_id = mc.id 
         AND bpr.medical_service_id IS NULL AND bpr.active = true
         LIMIT 1),
        bp.default_coverage_percent
    ) AS effective_coverage_percent,
    CASE 
        WHEN EXISTS (SELECT 1 FROM benefit_policy_rules bpr 
                     WHERE bpr.benefit_policy_id = bp.id AND bpr.medical_service_id = ms.id AND bpr.active = true)
        THEN 'SERVICE_RULE'
        WHEN EXISTS (SELECT 1 FROM benefit_policy_rules bpr 
                     WHERE bpr.benefit_policy_id = bp.id AND bpr.medical_category_id = mc.id 
                     AND bpr.medical_service_id IS NULL AND bpr.active = true)
        THEN 'CATEGORY_RULE'
        ELSE 'POLICY_DEFAULT'
    END AS coverage_source,
    COALESCE(
        (SELECT bpr.requires_pre_approval FROM benefit_policy_rules bpr 
         WHERE bpr.benefit_policy_id = bp.id AND bpr.medical_service_id = ms.id AND bpr.active = true
         LIMIT 1),
        (SELECT bpr.requires_pre_approval FROM benefit_policy_rules bpr 
         WHERE bpr.benefit_policy_id = bp.id AND bpr.medical_category_id = mc.id 
         AND bpr.medical_service_id IS NULL AND bpr.active = true
         LIMIT 1),
        true
    ) AS requires_pre_approval
FROM benefit_policies bp
CROSS JOIN medical_services ms
LEFT JOIN medical_categories mc ON ms.category_id = mc.id
WHERE bp.active = true AND ms.active = true;

COMMENT ON VIEW v_coverage_resolution IS 
'View for debugging/reporting coverage resolution. Shows effective coverage and PA requirement for each service under each policy.';

-- ════════════════════════════════════════════════════════════════════════════
-- 7. CREATE FUNCTION FOR REMAINING LIMIT CALCULATION
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_remaining_limit(
    p_member_id BIGINT,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
) RETURNS TABLE (
    annual_limit DECIMAL(15,2),
    used_amount DECIMAL(15,2),
    reserved_amount DECIMAL(15,2),
    remaining_limit DECIMAL(15,2),
    effective_remaining DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(bp.annual_limit, 0.00) AS annual_limit,
        COALESCE(
            (SELECT SUM(c.approved_amount) 
             FROM claims c 
             WHERE c.member_id = p_member_id 
             AND EXTRACT(YEAR FROM c.service_date) = p_year
             AND c.status IN ('APPROVED', 'SETTLED')
             AND c.approved_amount IS NOT NULL), 
            0.00
        ) AS used_amount,
        COALESCE(
            (SELECT SUM(pa.reserved_amount) 
             FROM pre_authorizations pa 
             WHERE pa.member_id = p_member_id 
             AND EXTRACT(YEAR FROM pa.request_date) = p_year
             AND pa.status = 'APPROVED'
             AND pa.reserved_amount IS NOT NULL), 
            0.00
        ) AS reserved_amount,
        COALESCE(bp.annual_limit, 0.00) - COALESCE(
            (SELECT SUM(c.approved_amount) 
             FROM claims c 
             WHERE c.member_id = p_member_id 
             AND EXTRACT(YEAR FROM c.service_date) = p_year
             AND c.status IN ('APPROVED', 'SETTLED')
             AND c.approved_amount IS NOT NULL), 
            0.00
        ) AS remaining_limit,
        -- Effective remaining = limit - used - reserved (for warning purposes)
        COALESCE(bp.annual_limit, 0.00) 
        - COALESCE(
            (SELECT SUM(c.approved_amount) 
             FROM claims c 
             WHERE c.member_id = p_member_id 
             AND EXTRACT(YEAR FROM c.service_date) = p_year
             AND c.status IN ('APPROVED', 'SETTLED')
             AND c.approved_amount IS NOT NULL), 
            0.00
        )
        - COALESCE(
            (SELECT SUM(pa.reserved_amount) 
             FROM pre_authorizations pa 
             WHERE pa.member_id = p_member_id 
             AND EXTRACT(YEAR FROM pa.request_date) = p_year
             AND pa.status = 'APPROVED'
             AND pa.reserved_amount IS NOT NULL), 
            0.00
        ) AS effective_remaining
    FROM members m
    LEFT JOIN benefit_policies bp ON m.benefit_policy_id = bp.id
    WHERE m.id = p_member_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_remaining_limit IS 
'Calculate remaining limit for a member. Returns: annual_limit, used_amount (from claims), reserved_amount (from approved PAs), remaining_limit, effective_remaining (limit - used - reserved)';
