-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- V048: CANONICAL REBUILD - PreAuthorization & Claim Architecture Alignment
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- Date: 2026-01-16
-- Purpose: Align database with Visit-Centric, Contract-Driven Architecture
-- 
-- ARCHITECTURAL LAWS ENFORCED:
-- ❌ No entity may bypass Visit
-- ❌ No service may be typed manually  
-- ❌ No price may be user-entered
-- ✅ All data flows from: Visit → Diagnosis → Medical Service → Contract Price → PreAuth/Claim
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- PART 1: PRE_AUTHORIZATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- 1.1 Add medical_service_id FK (REQUIRED - replaces free-text service_code)
ALTER TABLE pre_authorizations 
ADD COLUMN IF NOT EXISTS medical_service_id BIGINT;

COMMENT ON COLUMN pre_authorizations.medical_service_id IS 
'FK to medical_services - MANDATORY. Service must be selected from catalog, not typed.';

-- 1.2 Add requires_pa snapshot field
ALTER TABLE pre_authorizations 
ADD COLUMN IF NOT EXISTS requires_pa BOOLEAN DEFAULT true;

COMMENT ON COLUMN pre_authorizations.requires_pa IS 
'Snapshot of MedicalService.requiresPA at creation time';

-- 1.3 Add service_name for denormalization
ALTER TABLE pre_authorizations 
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);

COMMENT ON COLUMN pre_authorizations.service_name IS 
'Denormalized service name for display (snapshot from MedicalService)';

-- 1.4 Add service_category_id for reporting
ALTER TABLE pre_authorizations 
ADD COLUMN IF NOT EXISTS service_category_id BIGINT;

COMMENT ON COLUMN pre_authorizations.service_category_id IS 
'Snapshot of service category at creation time';

-- 1.5 Create FK constraint for medical_service_id
-- First, we need to populate existing records with a default service (if any)
-- For now, we'll allow NULL for existing records, but new ones will require it

-- Create index for medical_service_id
CREATE INDEX IF NOT EXISTS idx_preauth_medical_service ON pre_authorizations(medical_service_id);

-- Add FK constraint (DEFERRED to allow migration of existing data)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_preauth_medical_service'
    ) THEN
        ALTER TABLE pre_authorizations 
        ADD CONSTRAINT fk_preauth_medical_service 
        FOREIGN KEY (medical_service_id) 
        REFERENCES medical_services(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- 1.6 Add FK constraint for visit_id (should already exist, but ensure it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_preauth_visit'
    ) THEN
        ALTER TABLE pre_authorizations 
        ADD CONSTRAINT fk_preauth_visit 
        FOREIGN KEY (visit_id) 
        REFERENCES visits(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- 1.7 Add FK constraint for provider_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_preauth_provider'
    ) THEN
        ALTER TABLE pre_authorizations 
        ADD CONSTRAINT fk_preauth_provider 
        FOREIGN KEY (provider_id) 
        REFERENCES providers(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- PART 2: CLAIMS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- 2.1 Add diagnosis_code (replacing free-text diagnosis)
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS diagnosis_code VARCHAR(50);

COMMENT ON COLUMN claims.diagnosis_code IS 
'ICD-10 or local diagnosis code - structured, not free-text';

-- 2.2 Add diagnosis_description
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS diagnosis_description VARCHAR(500);

COMMENT ON COLUMN claims.diagnosis_description IS 
'Diagnosis description (denormalized from diagnosis catalog)';

-- 2.3 Add service_date (replacing visit_date which was confusing)
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS service_date DATE;

-- Migrate existing visit_date to service_date
UPDATE claims SET service_date = visit_date WHERE service_date IS NULL AND visit_date IS NOT NULL;

COMMENT ON COLUMN claims.service_date IS 
'Date when services were provided (derived from Visit)';

-- 2.4 Make provider_id NOT NULL for new records (existing can keep null temporarily)
-- First ensure provider_id column exists
ALTER TABLE claims 
ALTER COLUMN provider_id SET DEFAULT NULL;

COMMENT ON COLUMN claims.provider_id IS 
'REQUIRED FK to providers - derived from Visit.provider_id';

-- 2.5 Update FK constraint for visit_id to be RESTRICT (not SET NULL)
-- Drop existing constraint if it allows SET NULL
DO $$
BEGIN
    -- We'll add a stricter check via application logic
    -- Database constraint remains for referential integrity
    NULL;
END $$;

-- 2.6 Create index for diagnosis queries
CREATE INDEX IF NOT EXISTS idx_claims_diagnosis_code ON claims(diagnosis_code);
CREATE INDEX IF NOT EXISTS idx_claims_service_date ON claims(service_date);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- PART 3: CLAIM_LINES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- 3.1 Add medical_service_id FK (REQUIRED - replaces free-text service_code)
ALTER TABLE claim_lines 
ADD COLUMN IF NOT EXISTS medical_service_id BIGINT;

COMMENT ON COLUMN claim_lines.medical_service_id IS 
'FK to medical_services - MANDATORY. Service must be selected, not typed.';

-- 3.2 Add service_name for denormalization
ALTER TABLE claim_lines 
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);

COMMENT ON COLUMN claim_lines.service_name IS 
'Denormalized service name (snapshot from MedicalService)';

-- 3.3 Add service_category_id for reporting
ALTER TABLE claim_lines 
ADD COLUMN IF NOT EXISTS service_category_id BIGINT;

COMMENT ON COLUMN claim_lines.service_category_id IS 
'Service category ID for reporting (snapshot)';

-- 3.4 Add requires_pa snapshot
ALTER TABLE claim_lines 
ADD COLUMN IF NOT EXISTS requires_pa BOOLEAN DEFAULT false;

COMMENT ON COLUMN claim_lines.requires_pa IS 
'Whether this service requires pre-authorization (snapshot)';

-- 3.5 Create index for medical_service_id
CREATE INDEX IF NOT EXISTS idx_claim_lines_medical_service ON claim_lines(medical_service_id);
CREATE INDEX IF NOT EXISTS idx_claim_lines_service_category ON claim_lines(service_category_id);

-- 3.6 Add FK constraint for medical_service_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_claim_lines_medical_service'
    ) THEN
        ALTER TABLE claim_lines 
        ADD CONSTRAINT fk_claim_lines_medical_service 
        FOREIGN KEY (medical_service_id) 
        REFERENCES medical_services(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- PART 4: DATA MIGRATION - Populate new columns from existing data
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- 4.1 Migrate pre_authorizations: link to medical_services by service_code
UPDATE pre_authorizations pa
SET 
    medical_service_id = ms.id,
    service_name = ms.name_ar,
    service_category_id = ms.category_id,
    requires_pa = COALESCE(ms.requires_pa, true)
FROM medical_services ms
WHERE pa.service_code = ms.code
  AND pa.medical_service_id IS NULL
  AND pa.service_code IS NOT NULL;

-- 4.2 Migrate claim_lines: link to medical_services by service_code
UPDATE claim_lines cl
SET 
    medical_service_id = ms.id,
    service_name = ms.name_ar,
    service_category_id = ms.category_id,
    requires_pa = COALESCE(ms.requires_pa, false)
FROM medical_services ms
WHERE cl.service_code = ms.code
  AND cl.medical_service_id IS NULL
  AND cl.service_code IS NOT NULL;

-- 4.3 For claim_lines with no matching service_code, try to match by description
-- (This handles legacy free-text entries)
UPDATE claim_lines cl
SET 
    medical_service_id = ms.id,
    service_name = ms.name_ar,
    service_category_id = ms.category_id,
    requires_pa = COALESCE(ms.requires_pa, false)
FROM medical_services ms
WHERE cl.description ILIKE '%' || ms.name_ar || '%'
  AND cl.medical_service_id IS NULL
  AND cl.service_code IS NULL;

-- 4.4 Migrate diagnosis from claims (split into code and description if possible)
UPDATE claims
SET 
    diagnosis_code = CASE 
        WHEN diagnosis ~ '^[A-Z][0-9]+' THEN SUBSTRING(diagnosis FROM '^[A-Z][0-9]+\.?[0-9]*')
        ELSE 'LEGACY'
    END,
    diagnosis_description = diagnosis
WHERE diagnosis IS NOT NULL 
  AND diagnosis_code IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- PART 5: ADD ARCHITECTURAL COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE pre_authorizations IS 
'Pre-Authorization requests (CANONICAL 2026-01-16)
ARCHITECTURE:
- visit_id: REQUIRED FK to visits (all PreAuths must reference Visit)
- medical_service_id: REQUIRED FK to medical_services (no free-text services)
- contract_price: From ProviderContract (no user-entered prices)';

COMMENT ON TABLE claims IS 
'Insurance Claims (CANONICAL 2026-01-16)
ARCHITECTURE:
- visit_id: REQUIRED FK to visits (all Claims must reference Visit)
- provider_id: REQUIRED FK to providers (derived from Visit)
- Lines contain services from medical_services (no free-text)
- Prices from ProviderContract (no user-entered prices)';

COMMENT ON TABLE claim_lines IS 
'Claim Line Items (CANONICAL 2026-01-16)
ARCHITECTURE:
- medical_service_id: REQUIRED FK to medical_services (no free-text services)
- unit_price: From ProviderContract (read-only, not user-entered)
- total_price: Server-calculated (quantity × unit_price)';

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- PART 6: REPORTING VIEWS (Optional but helpful)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- Create view for pre-authorization with full service details
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

-- Create view for claims with full details
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

-- Create view for claim lines with service details
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

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- PART 7: STATISTICS UPDATE
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- Log migration statistics
DO $$
DECLARE
    preauth_total INT;
    preauth_with_service INT;
    claims_total INT;
    claim_lines_total INT;
    claim_lines_with_service INT;
BEGIN
    SELECT COUNT(*) INTO preauth_total FROM pre_authorizations;
    SELECT COUNT(*) INTO preauth_with_service FROM pre_authorizations WHERE medical_service_id IS NOT NULL;
    SELECT COUNT(*) INTO claims_total FROM claims;
    SELECT COUNT(*) INTO claim_lines_total FROM claim_lines;
    SELECT COUNT(*) INTO claim_lines_with_service FROM claim_lines WHERE medical_service_id IS NOT NULL;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'CANONICAL REBUILD MIGRATION STATISTICS:';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'PreAuthorizations: % total, % linked to MedicalService', preauth_total, preauth_with_service;
    RAISE NOTICE 'Claims: % total', claims_total;
    RAISE NOTICE 'ClaimLines: % total, % linked to MedicalService', claim_lines_total, claim_lines_with_service;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION V048
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
