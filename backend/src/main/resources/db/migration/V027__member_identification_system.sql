-- ════════════════════════════════════════════════════════════════════════════
-- V111__member_identification_system.sql
-- Member Identification System - Professional Implementation
-- ════════════════════════════════════════════════════════════════════════════
--
-- CHANGES:
-- 1. Add nationalNumber column (NULLABLE) - replaces civilId conceptually
-- 2. Rename qr_code_value → barcode
-- 3. Make cardNumber NULLABLE (user can input manually)
-- 4. Make barcode MANDATORY (auto-generated UUID)
-- 5. Add unique constraint on barcode
--
-- MIGRATION STRATEGY:
-- - Preserve existing data
-- - Backward compatible (civilId kept for legacy)
-- - Generate barcode for existing records
-- ════════════════════════════════════════════════════════════════════════════

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 0: Unify name fields (if not already done)
-- ============================================================================

-- Add full_name if not exists and merge from full_name_arabic/full_name_english
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'full_name'
    ) THEN
        -- Add column
        ALTER TABLE members ADD COLUMN full_name VARCHAR(200);
        
        -- Merge data
        UPDATE members
        SET full_name = COALESCE(
            NULLIF(full_name_arabic, ''), 
            full_name_english, 
            'Unknown'
        );
        
        -- Make NOT NULL
        ALTER TABLE members ALTER COLUMN full_name SET NOT NULL;
        
        -- Drop old columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'full_name_arabic') THEN
            ALTER TABLE members DROP COLUMN full_name_arabic;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'full_name_english') THEN
            ALTER TABLE members DROP COLUMN full_name_english;
        END IF;
        
        RAISE NOTICE '✅ Unified name fields: full_name_arabic + full_name_english → full_name';
    ELSE
        RAISE NOTICE 'ℹ️  full_name already exists - skipping unification';
    END IF;
END $$;

-- ============================================================================
-- STEP 1: Add nationalNumber column (NULLABLE)
-- ============================================================================

ALTER TABLE members
ADD COLUMN IF NOT EXISTS national_number VARCHAR(50);

COMMENT ON COLUMN members.national_number IS 'الرقم الوطني - OPTIONAL replacement for civilId';

-- ============================================================================
-- STEP 2: Rename qr_code_value to barcode
-- ============================================================================

-- Check if qr_code_value exists and barcode doesn't
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'qr_code_value'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'barcode'
    ) THEN
        -- Rename column
        ALTER TABLE members RENAME COLUMN qr_code_value TO barcode;
        
        -- Update constraint name if it exists
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'uk_member_qr_code_value'
        ) THEN
            ALTER TABLE members RENAME CONSTRAINT uk_member_qr_code_value TO uk_member_barcode;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Ensure barcode column exists and is properly configured
-- ============================================================================

-- Add barcode column if it doesn't exist
ALTER TABLE members
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);

-- Generate UUIDs for existing records without barcode
UPDATE members
SET barcode = gen_random_uuid()::text
WHERE barcode IS NULL OR barcode = '';

-- Make barcode NOT NULL and UNIQUE
ALTER TABLE members
ALTER COLUMN barcode SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uk_member_barcode'
    ) THEN
        ALTER TABLE members
        ADD CONSTRAINT uk_member_barcode UNIQUE (barcode);
    END IF;
END $$;

COMMENT ON COLUMN members.barcode IS 'Auto-generated unique barcode (UUID) for QR scanning and identification';

-- ============================================================================
-- STEP 4: Make cardNumber NULLABLE (remove NOT NULL constraint if exists)
-- ============================================================================

ALTER TABLE members
ALTER COLUMN card_number DROP NOT NULL;

-- Drop unique constraint and recreate as partial unique (unique when not null)
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uk_member_card_number'
    ) THEN
        ALTER TABLE members DROP CONSTRAINT uk_member_card_number;
    END IF;
    
    -- Create partial unique index (unique only when not null)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'uk_member_card_number_partial'
    ) THEN
        CREATE UNIQUE INDEX uk_member_card_number_partial 
        ON members (card_number) 
        WHERE card_number IS NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN members.card_number IS 'رقم بطاقة العضو - OPTIONAL, user can input manually, unique when not null';

-- ============================================================================
-- STEP 5: Create index on nationalNumber for search performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_members_national_number 
ON members (national_number)
WHERE national_number IS NOT NULL;

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN members.full_name IS 'الاسم الكامل - Single field accepting Arabic or English';
COMMENT ON COLUMN members.civil_id IS 'DEPRECATED - Use nationalNumber instead. Kept for backward compatibility';

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run manually to verify migration)
-- ════════════════════════════════════════════════════════════════════════════
--
-- -- Check column existence and types:
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable,
--     character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'members'
-- AND column_name IN ('full_name', 'national_number', 'card_number', 'barcode', 'civil_id')
-- ORDER BY column_name;
--
-- -- Check constraints:
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'members'::regclass
-- AND conname LIKE '%card_number%' OR conname LIKE '%barcode%';
--
-- -- Verify barcode generation:
-- SELECT id, card_number, barcode, national_number, civil_id
-- FROM members
-- LIMIT 5;
--
-- ════════════════════════════════════════════════════════════════════════════
