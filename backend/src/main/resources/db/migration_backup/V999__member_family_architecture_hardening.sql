-- ============================================================================
-- MEMBER & FAMILY ARCHITECTURE HARDENING - DATABASE CONSTRAINTS
-- ============================================================================
-- Purpose: Add UNIQUE constraints to prevent duplicate barcodes and card numbers
-- Date: 2026-01-10
-- Status: DEPRECATED - PARTIALLY OBSOLETE
-- ============================================================================
-- ⚠️ DEPRECATED: family_members constraints are obsolete as of V200
-- Active: members table constraints remain valid
-- Replacement: V200 adds constraints for unified architecture
-- ============================================================================

-- ============================================================================
-- 1. MEMBER TABLE CONSTRAINTS
-- ============================================================================

-- Add UNIQUE constraint on members.barcode (if table and constraint don't exist)
DO $$
BEGIN
    -- Check if member table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'members'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'uk_member_barcode'
        ) THEN
            ALTER TABLE members 
            ADD CONSTRAINT uk_member_barcode UNIQUE (barcode);
            
            RAISE NOTICE '✅ Added UNIQUE constraint: members.barcode';
        ELSE
            RAISE NOTICE 'ℹ️ UNIQUE constraint already exists: members.barcode';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table member does not exist yet - skipping constraint';
    END IF;
END $$;

-- Add UNIQUE constraint on members.card_number (nullable - unique when provided)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'uk_member_card_number'
        ) THEN
            ALTER TABLE members 
            ADD CONSTRAINT uk_member_card_number UNIQUE (card_number);
            
            RAISE NOTICE '✅ Added UNIQUE constraint: members.card_number';
        ELSE
            RAISE NOTICE 'ℹ️ UNIQUE constraint already exists: members.card_number';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table member does not exist yet - skipping constraint';
    END IF;
END $$;

-- Ensure barcode is NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'barcode' 
        AND is_nullable = 'YES'
    ) THEN
        -- First, set default for any null barcodes (shouldn't exist, but safety)
        UPDATE members SET barcode = 'WAAD-M-' || LPAD(id::text, 6, '0') 
        WHERE barcode IS NULL;
        
        ALTER TABLE members ALTER COLUMN barcode SET NOT NULL;
        
        RAISE NOTICE '✅ Set NOT NULL constraint: members.barcode';
    ELSE
        RAISE NOTICE 'ℹ️ NOT NULL constraint already exists: members.barcode';
    END IF;
END $$;

-- ============================================================================
-- 2. FAMILY_MEMBER TABLE CONSTRAINTS
-- ============================================================================

-- Add UNIQUE constraint on family_members.barcode (if not exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'uk_family_member_barcode'
        ) THEN
            ALTER TABLE family_members 
            ADD CONSTRAINT uk_family_member_barcode UNIQUE (barcode);
            
            RAISE NOTICE '✅ Added UNIQUE constraint: family_members.barcode';
        ELSE
            RAISE NOTICE 'ℹ️ UNIQUE constraint already exists: family_members.barcode';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table family_member does not exist yet - skipping constraint';
    END IF;
END $$;

-- Add UNIQUE constraint on family_members.card_number (nullable - unique when provided)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'uk_family_member_card_number'
        ) THEN
            ALTER TABLE family_members 
            ADD CONSTRAINT uk_family_member_card_number UNIQUE (card_number);
            
            RAISE NOTICE '✅ Added UNIQUE constraint: family_members.card_number';
        ELSE
            RAISE NOTICE 'ℹ️ UNIQUE constraint already exists: family_members.card_number';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table family_member does not exist yet - skipping constraint';
    END IF;
END $$;

-- Ensure barcode is NOT NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'family_members' 
            AND column_name = 'barcode' 
            AND is_nullable = 'YES'
        ) THEN
            -- First, set default for any null barcodes (shouldn't exist, but safety)
            UPDATE family_members SET barcode = 'WAAD-F-' || LPAD(id::text, 6, '0') 
            WHERE barcode IS NULL;
            
            ALTER TABLE family_members ALTER COLUMN barcode SET NOT NULL;
            
            RAISE NOTICE '✅ Set NOT NULL constraint: family_members.barcode';
        ELSE
            RAISE NOTICE 'ℹ️ NOT NULL constraint already exists: family_members.barcode';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table family_member does not exist yet - skipping constraint';
    END IF;
END $$;

-- ============================================================================
-- 3. VERIFY FOREIGN KEY (Member ↔ FamilyMember)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'fk_family_member_member'
        ) THEN
            ALTER TABLE family_members 
            ADD CONSTRAINT fk_family_member_member 
            FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Added FK constraint: family_member.member_id → member.id';
        ELSE
            RAISE NOTICE 'ℹ️ FK constraint already exists: family_member → member';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tables not ready yet - skipping FK constraint';
    END IF;
END $$;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on members.barcode (for QR code lookups)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        CREATE INDEX IF NOT EXISTS idx_member_barcode ON members(barcode);
        RAISE NOTICE '✅ Created index: members.barcode';
    END IF;
END $$;

-- Index on family_members.barcode (for QR code lookups)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        CREATE INDEX IF NOT EXISTS idx_family_member_barcode ON family_members(barcode);
        RAISE NOTICE '✅ Created index: family_members.barcode';
    END IF;
END $$;

-- Index on members.card_number (for card number searches)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        CREATE INDEX IF NOT EXISTS idx_member_card_number ON members(card_number) WHERE card_number IS NOT NULL;
        RAISE NOTICE '✅ Created index: members.card_number';
    END IF;
END $$;

-- Index on family_members.card_number (for card number searches)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        CREATE INDEX IF NOT EXISTS idx_family_member_card_number ON family_members(card_number) WHERE card_number IS NOT NULL;
        RAISE NOTICE '✅ Created index: family_members.card_number';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count duplicate barcodes (should be 0)
SELECT 'Duplicate member barcodes' AS check_name, COUNT(*) AS count
FROM (
    SELECT barcode, COUNT(*) 
    FROM members 
    WHERE barcode IS NOT NULL
    GROUP BY barcode 
    HAVING COUNT(*) > 1
) AS duplicates
UNION ALL
SELECT 'Duplicate family member barcodes', COUNT(*)
FROM (
    SELECT barcode, COUNT(*) 
    FROM family_members 
    WHERE barcode IS NOT NULL
    GROUP BY barcode 
    HAVING COUNT(*) > 1
) AS duplicates
UNION ALL
SELECT 'Duplicate member card numbers', COUNT(*)
FROM (
    SELECT card_number, COUNT(*) 
    FROM members 
    WHERE card_number IS NOT NULL
    GROUP BY card_number 
    HAVING COUNT(*) > 1
) AS duplicates
UNION ALL
SELECT 'Duplicate family member card numbers', COUNT(*)
FROM (
    SELECT card_number, COUNT(*) 
    FROM family_members 
    WHERE card_number IS NOT NULL
    GROUP BY card_number 
    HAVING COUNT(*) > 1
) AS duplicates;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MEMBER & FAMILY ARCHITECTURE HARDENING - COMPLETE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Constraints Added:';
    RAISE NOTICE '  - members.barcode: UNIQUE + NOT NULL';
    RAISE NOTICE '  - members.card_number: UNIQUE (nullable)';
    RAISE NOTICE '  - family_members.barcode: UNIQUE + NOT NULL';
    RAISE NOTICE '  - family_members.card_number: UNIQUE (nullable)';
    RAISE NOTICE '  - family_member.member_id: FK → member.id';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
