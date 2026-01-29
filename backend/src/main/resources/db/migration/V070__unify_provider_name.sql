-- =====================================================================
-- V070__unify_provider_name.sql
-- Unify provider name fields: name_arabic + name_english → name
-- 
-- This migration merges the bilingual name columns into a single 'name' column.
-- Data priority: name_arabic (preferred), fallback to name_english
-- =====================================================================

-- Step 1: Add unified 'name' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'providers' AND column_name = 'name') THEN
        ALTER TABLE providers ADD COLUMN name VARCHAR(200);
        RAISE NOTICE '✅ Added "name" column to providers table';
    ELSE
        RAISE NOTICE '⏭️ "name" column already exists';
    END IF;
END $$;

-- Step 2: Migrate data from name_arabic/name_english to name
-- Priority: name_arabic > name_english
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    UPDATE providers 
    SET name = COALESCE(NULLIF(name_arabic, ''), NULLIF(name_english, ''), 'Unknown Provider')
    WHERE name IS NULL;
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % rows to unified name column', migrated_count;
END $$;

-- Step 3: Make 'name' column NOT NULL
ALTER TABLE providers ALTER COLUMN name SET NOT NULL;

-- Step 4: Drop old columns AND dependent views
-- These views depend on name_arabic/name_english
DROP VIEW IF EXISTS v_preauthorizations_canonical CASCADE;
DROP VIEW IF EXISTS v_claims_canonical CASCADE;

-- Now safe to drop columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'providers' AND column_name = 'name_arabic') THEN
        ALTER TABLE providers DROP COLUMN name_arabic;
        RAISE NOTICE '✅ Dropped "name_arabic" column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'providers' AND column_name = 'name_english') THEN
        ALTER TABLE providers DROP COLUMN name_english;
        RAISE NOTICE '✅ Dropped "name_english" column';
    END IF;
END $$;

-- Step 5: Add index on name for search performance
CREATE INDEX IF NOT EXISTS idx_providers_name ON providers(name);
CREATE INDEX IF NOT EXISTS idx_providers_name_lower ON providers(LOWER(name));

-- Step 6: Recreate Views with Unified Name Column

-- VIEW 1: Pre-Authorizations Canonical View
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
    p.name AS provider_name_resolved, -- Unified name
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
'Canonical view for pre-authorizations with unified provider name. Updated in V070.';

-- VIEW 2: Claims Canonical View
CREATE OR REPLACE VIEW v_claims_canonical AS
SELECT 
    c.id,
    c.visit_id,
    v.visit_date,
    c.member_id,
    m.full_name AS member_name,
    m.civil_id AS member_civil_id,
    c.provider_id,
    p.name AS provider_name_resolved, -- Unified name
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
'Canonical view for claims with unified provider names. Updated in V070.';

-- Step 7: Verification
DO $$
DECLARE
    provider_count INTEGER;
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO provider_count FROM providers;
    SELECT COUNT(*) INTO null_count FROM providers WHERE name IS NULL;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION COMPLETE: Provider name unification';
    RAISE NOTICE '   Total providers: %', provider_count;
    RAISE NOTICE '   Providers with NULL name: %', null_count;
    RAISE NOTICE '   Views recreated: v_preauthorizations_canonical, v_claims_canonical';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
