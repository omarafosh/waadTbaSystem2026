-- ==============================================================================
-- UNIFIED MEMBER ARCHITECTURE - RADICAL REDESIGN
-- ==============================================================================
-- Version: V200
-- Date: 2026-01-11
-- Priority: CRITICAL - ARCHITECTURAL CHANGE
-- ==============================================================================
-- 
-- Purpose:
--   Implement unified Member architecture where both Principal and Dependent
--   members exist in the SAME table with self-referencing relationship.
--
-- Key Changes:
--   1. Add parent_id (self-referencing FK) to members table
--   2. Add relationship column (for dependents only)
--   3. Modify barcode constraint (nullable - only for principals)
--   4. Migrate data from family_members to members (if any exists)
--   5. Drop family_members table completely
--
-- Architecture:
--   Principal Member: parent_id = NULL, barcode = required
--   Dependent Member: parent_id = principal.id, barcode = NULL
--
-- ==============================================================================

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS TO MEMBERS TABLE
-- ============================================================================

-- Add parent_id for self-referencing relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE members ADD COLUMN parent_id BIGINT;
        RAISE NOTICE '✅ Added parent_id column to members table';
    ELSE
        RAISE NOTICE 'ℹ️ parent_id column already exists';
    END IF;
END $$;

-- Add relationship column for dependents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'relationship'
    ) THEN
        ALTER TABLE members ADD COLUMN relationship VARCHAR(20);
        RAISE NOTICE '✅ Added relationship column to members table';
    ELSE
        RAISE NOTICE 'ℹ️ relationship column already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: MIGRATE DATA FROM FAMILY_MEMBERS TO MEMBERS
-- ============================================================================

-- Migrate family members as dependent members
DO $$
DECLARE
    family_member_record RECORD;
    new_card_number VARCHAR(50);
    dependent_count INT;
BEGIN
    -- Check if family_members table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        
        RAISE NOTICE '📦 Starting migration from family_members to members...';
        
        -- Loop through all family members
        FOR family_member_record IN 
            SELECT 
                fm.id,
                fm.member_id,
                fm.relationship,
                fm.full_name,
                fm.civil_id,
                fm.birth_date,
                fm.gender,
                fm.status,
                fm.card_number,
                fm.phone,
                fm.notes,
                fm.active,
                fm.created_at,
                fm.updated_at,
                m.card_number as principal_card_number,
                m.employer_org_id,
                m.benefit_policy_id,
                m.policy_number
            FROM family_members fm
            INNER JOIN members m ON fm.member_id = m.id
        LOOP
            -- Generate card number with suffix
            IF family_member_record.principal_card_number IS NOT NULL THEN
                -- Count existing dependents for this principal
                SELECT COUNT(*) INTO dependent_count
                FROM members
                WHERE parent_id = family_member_record.member_id;
                
                -- Create card number: {principal_card}-{sequence}
                new_card_number := family_member_record.principal_card_number || '-' || LPAD((dependent_count + 1)::TEXT, 2, '0');
            ELSE
                new_card_number := NULL;
            END IF;
            
            -- Insert as dependent member
            INSERT INTO members (
                parent_id,
                relationship,
                employer_org_id,
                benefit_policy_id,
                full_name,
                civil_id,
                national_number,
                card_number,
                barcode,
                birth_date,
                gender,
                policy_number,
                phone,
                status,
                active,
                created_at,
                updated_at
            ) VALUES (
                family_member_record.member_id,                      -- parent_id
                family_member_record.relationship,                   -- relationship
                family_member_record.employer_org_id,                -- inherit from principal
                family_member_record.benefit_policy_id,              -- inherit from principal
                family_member_record.full_name,
                family_member_record.civil_id,
                family_member_record.civil_id,                       -- national_number = civil_id
                new_card_number,                                     -- card_number with suffix
                NULL,                                                -- barcode = NULL for dependents
                family_member_record.birth_date,
                family_member_record.gender,
                family_member_record.policy_number,
                family_member_record.phone,
                family_member_record.status,
                family_member_record.active,
                family_member_record.created_at,
                family_member_record.updated_at
            );
            
        END LOOP;
        
        RAISE NOTICE '✅ Migration completed successfully';
        
    ELSE
        RAISE NOTICE 'ℹ️ family_members table does not exist - skipping migration';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINT FOR PARENT_ID
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_member_parent'
    ) THEN
        ALTER TABLE members 
        ADD CONSTRAINT fk_member_parent 
        FOREIGN KEY (parent_id) REFERENCES members(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added FK constraint: members.parent_id → members.id';
    ELSE
        RAISE NOTICE 'ℹ️ FK constraint already exists: fk_member_parent';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: MODIFY BARCODE CONSTRAINT (NULLABLE FOR DEPENDENTS)
-- ============================================================================

-- Make barcode nullable (required only for principals)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'barcode' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE members ALTER COLUMN barcode DROP NOT NULL;
        RAISE NOTICE '✅ Modified barcode to be nullable (required only for principals)';
    ELSE
        RAISE NOTICE 'ℹ️ Barcode already nullable';
    END IF;
END $$;

-- Barcode remains UNIQUE (when not null)
-- Constraint uk_member_barcode already exists from previous migrations

-- ============================================================================
-- STEP 5: ADD VALIDATION CHECK CONSTRAINTS
-- ============================================================================

-- Check: Principals must have barcode
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_principal_has_barcode'
    ) THEN
        ALTER TABLE members 
        ADD CONSTRAINT chk_principal_has_barcode 
        CHECK (
            (parent_id IS NULL AND barcode IS NOT NULL) OR 
            (parent_id IS NOT NULL)
        );
        RAISE NOTICE '✅ Added CHECK constraint: principals must have barcode';
    ELSE
        RAISE NOTICE 'ℹ️ CHECK constraint already exists: chk_principal_has_barcode';
    END IF;
END $$;

-- Check: Dependents must have relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_dependent_has_relationship'
    ) THEN
        ALTER TABLE members 
        ADD CONSTRAINT chk_dependent_has_relationship 
        CHECK (
            (parent_id IS NULL AND relationship IS NULL) OR 
            (parent_id IS NOT NULL AND relationship IS NOT NULL)
        );
        RAISE NOTICE '✅ Added CHECK constraint: dependents must have relationship';
    ELSE
        RAISE NOTICE 'ℹ️ CHECK constraint already exists: chk_dependent_has_relationship';
    END IF;
END $$;

-- Check: Dependents should NOT have barcode
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_dependent_no_barcode'
    ) THEN
        ALTER TABLE members 
        ADD CONSTRAINT chk_dependent_no_barcode 
        CHECK (
            (parent_id IS NULL) OR 
            (parent_id IS NOT NULL AND barcode IS NULL)
        );
        RAISE NOTICE '✅ Added CHECK constraint: dependents should not have barcode';
    ELSE
        RAISE NOTICE 'ℹ️ CHECK constraint already exists: chk_dependent_no_barcode';
    END IF;
END $$;

-- ============================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on parent_id for fast dependent lookups
CREATE INDEX IF NOT EXISTS idx_members_parent_id ON members(parent_id) WHERE parent_id IS NOT NULL;
COMMENT ON INDEX idx_members_parent_id IS 'Fast lookup of dependents for a principal member';

-- Index on relationship for filtering
CREATE INDEX IF NOT EXISTS idx_members_relationship ON members(relationship) WHERE relationship IS NOT NULL;
COMMENT ON INDEX idx_members_relationship IS 'Filter dependents by relationship type';

-- Composite index for eligibility checks (barcode + active)
CREATE INDEX IF NOT EXISTS idx_members_barcode_active ON members(barcode, active) WHERE barcode IS NOT NULL;
COMMENT ON INDEX idx_members_barcode_active IS 'Fast eligibility checks via barcode';

-- ✅ Performance indexes created

-- ============================================================================
-- STEP 7: DROP FAMILY_MEMBERS TABLE (AFTER MIGRATION)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        
        -- Drop constraints first
        ALTER TABLE family_members DROP CONSTRAINT IF EXISTS uk_family_members_barcode;
        ALTER TABLE family_members DROP CONSTRAINT IF EXISTS uk_family_member_barcode;
        ALTER TABLE family_members DROP CONSTRAINT IF EXISTS uk_family_member_card_number;
        ALTER TABLE family_members DROP CONSTRAINT IF EXISTS fk_family_member_member;
        
        -- Drop indexes
        DROP INDEX IF EXISTS idx_family_members_barcode;
        DROP INDEX IF EXISTS idx_family_member_barcode;
        DROP INDEX IF EXISTS idx_family_member_card_number;
        
        -- Drop table
        DROP TABLE family_members CASCADE;
        
        RAISE NOTICE '✅ Dropped family_members table and all related constraints/indexes';
    ELSE
        RAISE NOTICE 'ℹ️ family_members table already dropped';
    END IF;
END $$;

-- ============================================================================
-- STEP 8: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN members.parent_id IS 
'Self-referencing FK to parent member. NULL = Principal, NOT NULL = Dependent';

COMMENT ON COLUMN members.relationship IS 
'Relationship type for dependents only (WIFE, HUSBAND, SON, DAUGHTER, etc.). NULL for principals.';

COMMENT ON COLUMN members.barcode IS 
'Unique barcode for Principal members only. NULL for Dependents. Used for family eligibility verification.';

COMMENT ON COLUMN members.card_number IS 
'Unified card number. Principal: base number. Dependent: principal_card-{sequence}.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify principals have barcodes
SELECT 'Principals without barcode' AS check_name, COUNT(*) AS count
FROM members WHERE parent_id IS NULL AND barcode IS NULL
UNION ALL
-- Verify dependents have relationships
SELECT 'Dependents without relationship', COUNT(*)
FROM members WHERE parent_id IS NOT NULL AND relationship IS NULL
UNION ALL
-- Verify dependents have NO barcode
SELECT 'Dependents with barcode (ERROR)', COUNT(*)
FROM members WHERE parent_id IS NOT NULL AND barcode IS NOT NULL
UNION ALL
-- Count principals
SELECT 'Total Principals', COUNT(*)
FROM members WHERE parent_id IS NULL
UNION ALL
-- Count dependents
SELECT 'Total Dependents', COUNT(*)
FROM members WHERE parent_id IS NOT NULL;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ UNIFIED MEMBER ARCHITECTURE - MIGRATION COMPLETE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Architecture Changes:';
    RAISE NOTICE '  ✓ Added parent_id (self-referencing)';
    RAISE NOTICE '  ✓ Added relationship column';
    RAISE NOTICE '  ✓ Modified barcode (nullable for dependents)';
    RAISE NOTICE '  ✓ Migrated data from family_members';
    RAISE NOTICE '  ✓ Dropped family_members table';
    RAISE NOTICE '  ✓ Added validation constraints';
    RAISE NOTICE '  ✓ Created performance indexes';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Business Rules:';
    RAISE NOTICE '  • Principal: parent_id = NULL, barcode REQUIRED';
    RAISE NOTICE '  • Dependent: parent_id = principal.id, barcode = NULL';
    RAISE NOTICE '  • Relationship: Required for dependents, NULL for principals';
    RAISE NOTICE '  • Card Number: Unified with suffix for dependents';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
