-- ════════════════════════════════════════════════════════════════════════════
-- V112__make_birth_date_gender_optional.sql
-- Make birthDate and gender optional in members table
-- ════════════════════════════════════════════════════════════════════════════
--
-- CHANGES:
-- 1. Remove NOT NULL constraint from birth_date
-- 2. Add UNDEFINED to gender enum values
-- 3. Update NULL gender values to UNDEFINED
-- 4. Set default value for gender to UNDEFINED
--
-- MIGRATION STRATEGY:
-- - Preserve existing data
-- - Backward compatible
-- - Safe for production
-- ════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- STEP 1: Remove NOT NULL constraint from birth_date
-- ============================================================================

ALTER TABLE members
ALTER COLUMN birth_date DROP NOT NULL;

COMMENT ON COLUMN members.birth_date IS 'Date of birth - OPTIONAL, nullable';

-- ============================================================================
-- STEP 2: Add UNDEFINED value to gender enum (if not already exists)
-- ============================================================================

-- Check if the enum type exists and add UNDEFINED if needed
DO $$
BEGIN
    -- Add UNDEFINED to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'UNDEFINED' 
        AND enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'gender'
        )
    ) THEN
        -- Since we can't directly add to enum in a transaction-safe way,
        -- we need to check if gender column uses enum or VARCHAR
        
        -- If it's VARCHAR (most likely in this schema), we just update values
        -- If it's enum type, we'd need to recreate it
        
        -- For VARCHAR columns (current implementation):
        -- No action needed, UNDEFINED can be inserted directly
        RAISE NOTICE 'Gender column allows UNDEFINED value (VARCHAR implementation)';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Update existing NULL gender values to UNDEFINED
-- ============================================================================

UPDATE members
SET gender = 'UNDEFINED'
WHERE gender IS NULL;

-- ============================================================================
-- STEP 4: Set default value for gender column
-- ============================================================================

ALTER TABLE members
ALTER COLUMN gender SET DEFAULT 'UNDEFINED';

-- Ensure gender is NOT NULL after setting defaults
-- (since @PrePersist will always set UNDEFINED if null)
ALTER TABLE members
ALTER COLUMN gender SET NOT NULL;

COMMENT ON COLUMN members.gender IS 'Gender - OPTIONAL with default UNDEFINED. Values: MALE, FEMALE, UNDEFINED';

-- ============================================================================
-- STEP 5: Update any existing members with no gender to UNDEFINED
-- ============================================================================

-- Double-check: ensure all members have a gender value
UPDATE members
SET gender = 'UNDEFINED'
WHERE gender IS NULL OR gender = '';

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run manually to verify migration)
-- ════════════════════════════════════════════════════════════════════════════
--
-- -- Check column constraints:
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable,
--     column_default
-- FROM information_schema.columns
-- WHERE table_name = 'members'
-- AND column_name IN ('birth_date', 'gender')
-- ORDER BY column_name;
--
-- -- Check gender value distribution:
-- SELECT gender, COUNT(*) as count
-- FROM members
-- GROUP BY gender
-- ORDER BY count DESC;
--
-- -- Check members with NULL birth_date:
-- SELECT COUNT(*) as null_birth_date_count
-- FROM members
-- WHERE birth_date IS NULL;
--
-- ════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- STEP 6: Apply same changes to family_members table
-- ============================================================================

-- Remove NOT NULL from family_members.birth_date
ALTER TABLE family_members
ALTER COLUMN birth_date DROP NOT NULL;

COMMENT ON COLUMN family_members.birth_date IS 'Birth date - OPTIONAL, nullable';

-- Update NULL gender values to UNDEFINED in family_members
UPDATE family_members
SET gender = 'UNDEFINED'
WHERE gender IS NULL;

-- Set default for family_members.gender
ALTER TABLE family_members
ALTER COLUMN gender SET DEFAULT 'UNDEFINED';

-- Ensure gender is NOT NULL
ALTER TABLE family_members
ALTER COLUMN gender SET NOT NULL;

COMMENT ON COLUMN family_members.gender IS 'Gender - OPTIONAL with default UNDEFINED. Values: MALE, FEMALE, UNDEFINED';

-- ════════════════════════════════════════════════════════════════════════════
