-- ============================================================================
-- V041: Enforce Visit-Centric Architecture for Pre-Authorizations
-- Date: 2026-01-14
-- Description: Pre-authorizations MUST be linked to a Visit
-- ============================================================================
-- ARCHITECTURAL RULE:
-- Pre-authorizations can ONLY be created from an existing Visit.
-- This migration enforces referential integrity between pre_authorizations and visits.
-- Eligibility → Visit → PreAuth/Claim (Visit-Centric Architecture)
-- ============================================================================

-- Step 1: Add foreign key constraint for visit_id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_preauth_visit'
        AND table_name = 'pre_authorizations'
    ) THEN
        -- Add FK constraint (allows NULL for historical records created before this policy)
        ALTER TABLE pre_authorizations 
        ADD CONSTRAINT fk_preauth_visit 
        FOREIGN KEY (visit_id) 
        REFERENCES visits(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added FK constraint fk_preauth_visit to pre_authorizations';
    END IF;
END $$;

-- Step 2: Add comment documenting the architectural rule
COMMENT ON COLUMN pre_authorizations.visit_id IS 
'REQUIRED for new records (2026-01-14): Visit-Centric Architecture.
Pre-authorizations must originate from a Visit record.
Historical records may have NULL values.';

-- Step 3: Create an audit table entry for tracking this policy change
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pre_authorization_audit'
    ) THEN
        INSERT INTO pre_authorization_audit (
            pre_authorization_id, 
            action, 
            notes, 
            changed_by, 
            change_date
        )
        SELECT 
            id,
            'POLICY_CHANGE',
            'Visit-Centric Architecture enforced: visit_id now required for new pre-authorizations',
            'system',
            NOW()
        FROM pre_authorizations
        WHERE visit_id IS NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Step 4: Log migration info
DO $$
BEGIN
    RAISE NOTICE 'V041: Visit-Centric Architecture enforced for pre_authorizations';
    RAISE NOTICE 'New pre-authorizations MUST have visit_id set';
    RAISE NOTICE 'Historical records with NULL visit_id are preserved';
END $$;
