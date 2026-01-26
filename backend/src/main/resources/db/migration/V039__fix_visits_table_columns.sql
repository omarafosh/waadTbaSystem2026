-- ============================================================================
-- Migration: V039__fix_visits_table_columns.sql
-- Purpose: Fix missing columns in visits table for Provider Portal visit registration
-- Date: 2026-01-13
-- ============================================================================
-- 
-- PROBLEM:
-- When registering a visit from Provider Portal after eligibility check, the system
-- throws: "ERROR: column 'active' of relation 'visits' does not exist"
-- 
-- This migration adds all missing columns required by the Visit entity to support
-- the new Pre-Authorization/Claim flow where Visit is the central linking entity.
--
-- NEW FLOW (2026-01-13):
-- 1. Provider performs eligibility check
-- 2. Provider clicks "Register Visit" → Visit record created
-- 3. Provider creates Claim or Pre-Authorization from Visit Log
--
-- COLUMNS BEING ADDED (if not exist):
-- - active: Soft delete flag
-- - eligibility_check_id: Links visit to eligibility verification
-- - employer_org_id: Denormalized employer for filtering
-- - specialty: Medical specialty
-- - treatment: Treatment provided
-- - total_amount: Total visit cost
-- ============================================================================

-- ============================================================================
-- 1. ADD 'active' COLUMN (CRITICAL - causing the error)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'active'
    ) THEN
        ALTER TABLE visits ADD COLUMN active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE '✅ Added column: active';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: active';
    END IF;
END $$;

COMMENT ON COLUMN visits.active IS 'Soft delete flag. FALSE = visit is logically deleted';

-- ============================================================================
-- 2. ADD 'eligibility_check_id' COLUMN (links visit to eligibility verification)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'eligibility_check_id'
    ) THEN
        ALTER TABLE visits ADD COLUMN eligibility_check_id BIGINT;
        RAISE NOTICE '✅ Added column: eligibility_check_id';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: eligibility_check_id';
    END IF;
END $$;

COMMENT ON COLUMN visits.eligibility_check_id IS 'ID of the eligibility check that created this visit (Provider Portal flow)';

-- ============================================================================
-- 3. ADD 'employer_org_id' COLUMN (denormalized employer for efficient queries)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'employer_org_id'
    ) THEN
        ALTER TABLE visits ADD COLUMN employer_org_id BIGINT;
        RAISE NOTICE '✅ Added column: employer_org_id';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: employer_org_id';
    END IF;
END $$;

COMMENT ON COLUMN visits.employer_org_id IS 'Denormalized employer organization ID for efficient filtering';

-- ============================================================================
-- 4. ADD 'specialty' COLUMN (medical specialty)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'specialty'
    ) THEN
        ALTER TABLE visits ADD COLUMN specialty VARCHAR(200);
        RAISE NOTICE '✅ Added column: specialty';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: specialty';
    END IF;
END $$;

COMMENT ON COLUMN visits.specialty IS 'Medical specialty of the treating physician';

-- ============================================================================
-- 5. ADD 'treatment' COLUMN (treatment provided)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'treatment'
    ) THEN
        ALTER TABLE visits ADD COLUMN treatment TEXT;
        RAISE NOTICE '✅ Added column: treatment';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: treatment';
    END IF;
END $$;

COMMENT ON COLUMN visits.treatment IS 'Treatment provided during the visit';

-- ============================================================================
-- 6. ADD 'total_amount' COLUMN (visit cost)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE visits ADD COLUMN total_amount NUMERIC(15, 2);
        RAISE NOTICE '✅ Added column: total_amount';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: total_amount';
    END IF;
END $$;

COMMENT ON COLUMN visits.total_amount IS 'Total cost of the visit';

-- ============================================================================
-- 7. ADD 'diagnosis' COLUMN (if missing - convert from diagnosis_description)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'diagnosis'
    ) THEN
        -- Check if diagnosis_description exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'visits' AND column_name = 'diagnosis_description'
        ) THEN
            ALTER TABLE visits RENAME COLUMN diagnosis_description TO diagnosis;
            RAISE NOTICE '✅ Renamed column: diagnosis_description → diagnosis';
        ELSE
            ALTER TABLE visits ADD COLUMN diagnosis TEXT;
            RAISE NOTICE '✅ Added column: diagnosis';
        END IF;
    ELSE
        RAISE NOTICE '⏭️ Column already exists: diagnosis';
    END IF;
END $$;

COMMENT ON COLUMN visits.diagnosis IS 'Medical diagnosis for the visit';

-- ============================================================================
-- 8. ENSURE 'doctor_name' COLUMN EXISTS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'doctor_name'
    ) THEN
        ALTER TABLE visits ADD COLUMN doctor_name VARCHAR(200);
        RAISE NOTICE '✅ Added column: doctor_name';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: doctor_name';
    END IF;
END $$;

-- ============================================================================
-- 9. ENSURE 'created_at' COLUMN EXISTS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE visits ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Added column: created_at';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: created_at';
    END IF;
END $$;

-- ============================================================================
-- 10. ENSURE 'updated_at' COLUMN EXISTS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE visits ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Added column: updated_at';
    ELSE
        RAISE NOTICE '⏭️ Column already exists: updated_at';
    END IF;
END $$;

-- ============================================================================
-- 11. UPDATE 'status' COLUMN TYPE (ensure it can hold VisitStatus enum values)
-- ============================================================================
DO $$
BEGIN
    -- Ensure status column can hold the new VisitStatus enum values
    -- REGISTERED, IN_PROGRESS, PENDING_PREAUTH, PREAUTH_APPROVED, CLAIM_SUBMITTED, COMPLETED, CANCELLED
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'status'
    ) THEN
        -- Extend the varchar length if needed
        ALTER TABLE visits ALTER COLUMN status TYPE VARCHAR(30);
        RAISE NOTICE '✅ Updated column: status type to VARCHAR(30)';
    END IF;
END $$;

-- ============================================================================
-- 12. MAKE provider_id NULLABLE (not always available in Provider Portal flow)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visits' AND column_name = 'provider_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE visits ALTER COLUMN provider_id DROP NOT NULL;
        RAISE NOTICE '✅ Made column nullable: provider_id';
    ELSE
        RAISE NOTICE '⏭️ Column already nullable or does not exist: provider_id';
    END IF;
END $$;

-- ============================================================================
-- 13. CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_visits_active ON visits(active);
CREATE INDEX IF NOT EXISTS idx_visits_eligibility_check_id ON visits(eligibility_check_id);
CREATE INDEX IF NOT EXISTS idx_visits_employer_org_id ON visits(employer_org_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_member_id ON visits(member_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date);

-- ============================================================================
-- 14. ADD FOREIGN KEY CONSTRAINTS (if not exist)
-- ============================================================================
DO $$
BEGIN
    -- FK to eligibility_checks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_visits_eligibility_check' AND table_name = 'visits'
    ) THEN
        -- Only add if eligibility_checks table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'eligibility_checks') THEN
            ALTER TABLE visits 
            ADD CONSTRAINT fk_visits_eligibility_check 
            FOREIGN KEY (eligibility_check_id) REFERENCES eligibility_checks(id);
            RAISE NOTICE '✅ Added FK: fk_visits_eligibility_check';
        END IF;
    ELSE
        RAISE NOTICE '⏭️ FK already exists: fk_visits_eligibility_check';
    END IF;
    
    -- FK to organizations (employer)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_visits_employer_org' AND table_name = 'visits'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
            ALTER TABLE visits 
            ADD CONSTRAINT fk_visits_employer_org 
            FOREIGN KEY (employer_org_id) REFERENCES organizations(id);
            RAISE NOTICE '✅ Added FK: fk_visits_employer_org';
        END IF;
    ELSE
        RAISE NOTICE '⏭️ FK already exists: fk_visits_employer_org';
    END IF;
END $$;

-- ============================================================================
-- 15. SET DEFAULT VALUE FOR active ON EXISTING ROWS
-- ============================================================================
UPDATE visits SET active = TRUE WHERE active IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ Migration V039 Complete: visits table columns fixed';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'The following columns are now available:';
    RAISE NOTICE '  - active (BOOLEAN)';
    RAISE NOTICE '  - eligibility_check_id (BIGINT)';
    RAISE NOTICE '  - employer_org_id (BIGINT)';
    RAISE NOTICE '  - specialty (VARCHAR)';
    RAISE NOTICE '  - treatment (TEXT)';
    RAISE NOTICE '  - total_amount (NUMERIC)';
    RAISE NOTICE '  - diagnosis (TEXT)';
    RAISE NOTICE '  - doctor_name (VARCHAR)';
    RAISE NOTICE '  - created_at (TIMESTAMP)';
    RAISE NOTICE '  - updated_at (TIMESTAMP)';
    RAISE NOTICE '  - status (VARCHAR - supports VisitStatus enum)';
    RAISE NOTICE '';
    RAISE NOTICE 'Provider Portal visit registration should now work correctly.';
    RAISE NOTICE '============================================================';
END $$;
