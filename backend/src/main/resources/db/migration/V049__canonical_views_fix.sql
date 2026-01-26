-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- V049: Fix Canonical Reporting Views (Column Names Correction)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- Date: 2026-01-16
-- Purpose: Correct column name references in canonical views
-- 
-- Fixes:
--   - providers: name_ar/name_en → name_arabic/name_english  
--   - medical_categories: name → name_ar
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- Drop existing views if they exist (in case partially created)
DROP VIEW IF EXISTS v_claim_lines_canonical CASCADE;
DROP VIEW IF EXISTS v_claims_canonical CASCADE;
DROP VIEW IF EXISTS v_preauthorizations_canonical CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- VIEW 1: Pre-Authorizations Canonical View
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_preauthorizations_canonical AS
SELECT 
    pa.id,
    pa.pre_auth_number,
    pa.visit_id,
    v.visit_date,
    pa.member_id,
    m.full_name AS member_name,
    m.civil_id AS member_civil_id,
    pa.provider_id,
    COALESCE(p.name_arabic, p.name_english) AS provider_name_resolved,
    pa.medical_service_id,
    ms.code AS service_code_resolved,
    ms.name_ar AS service_name_resolved,
    mc.name_ar AS service_category_name,
    pa.contract_price,
    pa.approved_amount,
    pa.status,
    pa.diagnosis_code,
    pa.diagnosis_description,
    pa.request_date,
    pa.created_at,
    pa.updated_at
FROM pre_authorizations pa
LEFT JOIN visits v ON pa.visit_id = v.id
LEFT JOIN members m ON pa.member_id = m.id
LEFT JOIN providers p ON pa.provider_id = p.id
LEFT JOIN medical_services ms ON pa.medical_service_id = ms.id
LEFT JOIN medical_categories mc ON ms.category_id = mc.id
WHERE pa.active = true;

COMMENT ON VIEW v_preauthorizations_canonical IS 
'Canonical view for pre-authorizations with resolved provider/service names.
Use for reporting and exports. Not used by Backend JPA.';

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- VIEW 2: Claims Canonical View
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_claims_canonical AS
SELECT 
    c.id,
    c.visit_id,
    v.visit_date,
    c.member_id,
    m.full_name AS member_name,
    m.civil_id AS member_civil_id,
    c.provider_id,
    COALESCE(p.name_arabic, p.name_english) AS provider_name_resolved,
    c.diagnosis_code,
    c.diagnosis_description,
    c.service_date,
    c.requested_amount,
    c.approved_amount,
    c.status,
    (SELECT COUNT(*) FROM claim_lines cl WHERE cl.claim_id = c.id) AS line_count,
    c.pre_authorization_id,
    c.created_at,
    c.updated_at
FROM claims c
LEFT JOIN visits v ON c.visit_id = v.id
LEFT JOIN members m ON c.member_id = m.id
LEFT JOIN providers p ON c.provider_id = p.id
WHERE c.active = true;

COMMENT ON VIEW v_claims_canonical IS 
'Canonical view for claims with resolved provider names.
Use for reporting and exports. Not used by Backend JPA.';

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- VIEW 3: Claim Lines Canonical View
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_claim_lines_canonical AS
SELECT 
    cl.id,
    cl.claim_id,
    c.visit_id,
    cl.medical_service_id,
    ms.code AS service_code_resolved,
    ms.name_ar AS service_name_resolved,
    mc.name_ar AS category_name,
    cl.quantity,
    cl.unit_price,
    cl.total_price,
    cl.requires_pa
FROM claim_lines cl
JOIN claims c ON cl.claim_id = c.id
LEFT JOIN medical_services ms ON cl.medical_service_id = ms.id
LEFT JOIN medical_categories mc ON ms.category_id = mc.id;

COMMENT ON VIEW v_claim_lines_canonical IS 
'Canonical view for claim lines with resolved service/category names.
Use for reporting and exports. Not used by Backend JPA.';

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'V049: CANONICAL VIEWS CREATED SUCCESSFULLY';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - v_preauthorizations_canonical';
    RAISE NOTICE '  - v_claims_canonical';
    RAISE NOTICE '  - v_claim_lines_canonical';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
END $$;
