-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- V060: Claims Data Fix - Fill Missing Fields from Related Entities
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- Date: 2026-01-22
-- Purpose: Fix claims with null provider_name, visit_date, etc. by populating from related tables
-- 
-- PROBLEM: Claims created before Visit-Centric architecture have missing denormalized fields
-- SOLUTION: Backfill from Visit → Provider relationships
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- STEP 1: Fill provider_name from providers table (use name_arabic or name_english)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE claims c
SET provider_name = COALESCE(p.name_arabic, p.name_english)
FROM providers p
WHERE c.provider_id = p.id
  AND c.provider_name IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- STEP 2: Fill service_date from visit.visit_date
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE claims c
SET service_date = v.visit_date
FROM visits v
WHERE c.visit_id = v.id
  AND c.service_date IS NULL
  AND v.visit_date IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- STEP 3: Fill doctor_name from visit.doctor_name if available
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE claims c
SET doctor_name = v.doctor_name
FROM visits v
WHERE c.visit_id = v.id
  AND c.doctor_name IS NULL
  AND v.doctor_name IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- STEP 4: Fill diagnosis fields from visit.diagnosis if available
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE claims c
SET diagnosis_description = v.diagnosis
FROM visits v
WHERE c.visit_id = v.id
  AND c.diagnosis_description IS NULL
  AND v.diagnosis IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- STEP 5: Fill provider_id from visit if claim doesn't have it
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE claims c
SET provider_id = v.provider_id
FROM visits v
WHERE c.visit_id = v.id
  AND c.provider_id IS NULL
  AND v.provider_id IS NOT NULL;

-- Then fill provider_name again for any newly-set provider_ids
UPDATE claims c
SET provider_name = COALESCE(p.name_arabic, p.name_english)
FROM providers p
WHERE c.provider_id = p.id
  AND c.provider_name IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- STEP 6: Set default service_date to created_at date if still null
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE claims
SET service_date = DATE(created_at)
WHERE service_date IS NULL
  AND created_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- STEP 7: Set default doctor_name placeholder if still null
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE claims
SET doctor_name = 'الطبيب المعالج'
WHERE doctor_name IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- LOGGING: Count fixed records
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fixed_count FROM claims WHERE provider_name IS NOT NULL;
    RAISE NOTICE 'Claims with provider_name filled: %', fixed_count;
    
    SELECT COUNT(*) INTO fixed_count FROM claims WHERE service_date IS NOT NULL;
    RAISE NOTICE 'Claims with service_date filled: %', fixed_count;
    
    SELECT COUNT(*) INTO fixed_count FROM claims WHERE doctor_name IS NOT NULL;
    RAISE NOTICE 'Claims with doctor_name filled: %', fixed_count;
END $$;
