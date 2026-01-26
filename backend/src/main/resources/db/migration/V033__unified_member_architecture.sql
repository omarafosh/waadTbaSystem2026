-- ==============================================================================
-- UNIFIED MEMBER ARCHITECTURE - RADICAL REDESIGN
-- ==============================================================================
-- Version: V033
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
--   4. Drop family_members table (if exists - legacy cleanup)
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
-- STEP 2: DROP FAMILY_MEMBERS TABLE (IF EXISTS - LEGACY CLEANUP)
-- ============================================================================

-- Note: family_members table was never created in the current migration sequence.
-- This step exists for safety in case the table exists from old manual operations.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        DROP TABLE family_members CASCADE;
        RAISE NOTICE '✅ Dropped legacy family_members table';
    ELSE
        RAISE NOTICE 'ℹ️ family_members table does not exist - no cleanup needed';
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

-- ============================================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
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
    RAISE NOTICE '  ✓ Dropped family_members table (if existed)';
    RAISE NOTICE '  ✓ Added validation constraints';
    RAISE NOTICE '  ✓ Created performance indexes';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Business Rules:';
    RAISE NOTICE '  • Principal: parent_id = NULL, barcode REQUIRED';
    RAISE NOTICE '  • Dependent: parent_id = member.id, relationship REQUIRED';
    RAISE NOTICE '  • Dependents cannot have barcode (inherited from principal)';
    RAISE NOTICE '  • Card Number: Principal uses base, Dependent gets suffix';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
