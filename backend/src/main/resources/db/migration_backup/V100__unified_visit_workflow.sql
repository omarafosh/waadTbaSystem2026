-- =====================================================
-- Unified Visit Workflow Migration
-- Version: V100
-- Date: 2026-01-04
-- Purpose: Link all medical operations to unified visit_id
-- =====================================================

-- ========================================
-- 1. Add visit_id to claims table
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'claims' AND column_name = 'visit_id') THEN
        ALTER TABLE claims ADD COLUMN visit_id BIGINT;
        RAISE NOTICE 'Added visit_id column to claims table';
    END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_claims_visit' AND table_name = 'claims') THEN
        ALTER TABLE claims 
            ADD CONSTRAINT fk_claims_visit 
            FOREIGN KEY (visit_id) 
            REFERENCES visits(id) 
            ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint fk_claims_visit';
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_claims_visit_id ON claims(visit_id);

-- Add comment for documentation
COMMENT ON COLUMN claims.visit_id IS 'Links claim to the originating medical visit (unified workflow)';

-- ========================================
-- 2. Add visit_id to eligibility_checks table
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eligibility_checks' AND column_name = 'visit_id') THEN
        ALTER TABLE eligibility_checks ADD COLUMN visit_id BIGINT;
        RAISE NOTICE 'Added visit_id column to eligibility_checks table';
    END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_eligibility_visit' AND table_name = 'eligibility_checks') THEN
        ALTER TABLE eligibility_checks 
            ADD CONSTRAINT fk_eligibility_visit 
            FOREIGN KEY (visit_id) 
            REFERENCES visits(id) 
            ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint fk_eligibility_visit';
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_eligibility_visit_id ON eligibility_checks(visit_id);

-- Add comment for documentation
COMMENT ON COLUMN eligibility_checks.visit_id IS 'Links eligibility check to a visit (optional - for unified workflow)';

-- ========================================
-- 3. Add workflow_type to visits table
-- ========================================
-- Track if visit was created via new unified workflow or legacy system
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visits' AND column_name = 'workflow_type') THEN
        ALTER TABLE visits ADD COLUMN workflow_type VARCHAR(20) DEFAULT 'LEGACY';
        RAISE NOTICE 'Added workflow_type column to visits table';
    END IF;
END $$;

COMMENT ON COLUMN visits.workflow_type IS 'Workflow type: UNIFIED (new workflow with eligibility check) or LEGACY (old standalone visit)';

-- ========================================
-- 4. Performance indexes
-- ========================================
-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_claims_member_visit ON claims(member_id, visit_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_member_visit ON eligibility_checks(member_id, visit_id);
CREATE INDEX IF NOT EXISTS idx_visits_workflow_type ON visits(workflow_type);

-- ========================================
-- 5. Statistics and verification
-- ========================================
DO $$
DECLARE
    visits_count BIGINT;
    claims_count BIGINT;
    eligibility_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO visits_count FROM visits;
    SELECT COUNT(*) INTO claims_count FROM claims;
    SELECT COUNT(*) INTO eligibility_count FROM eligibility_checks;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Unified Visit Workflow Migration Complete';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Current data counts:';
    RAISE NOTICE '  - Visits: %', visits_count;
    RAISE NOTICE '  - Claims: %', claims_count;
    RAISE NOTICE '  - Eligibility Checks: %', eligibility_count;
    RAISE NOTICE '============================================';
    RAISE NOTICE 'New fields added:';
    RAISE NOTICE '  ✓ claims.visit_id';
    RAISE NOTICE '  ✓ eligibility_checks.visit_id';
    RAISE NOTICE '  ✓ visits.workflow_type';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Ready for unified workflow implementation';
    RAISE NOTICE '============================================';
END $$;
