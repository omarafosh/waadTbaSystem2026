-- Radical Fix for Member Identity - Backend Phase 4 Prep
-- Date: 2026-01-10
-- Objective: Separate ID, CardNumber, and Barcode completely. Establish Barcode as the primary visual ID.

-- 1. Create Sequence for atomic barcode generation (if not exists)
CREATE SEQUENCE IF NOT EXISTS member_barcode_seq START WITH 1 INCREMENT BY 1;

-- 2. Repair Data: Replace NULL, Empty, or UUID (length > 30) barcodes with Canonical Format
-- This ensures all existing members get a compliant WAD-YYYY-SEQ barcode.
-- We use the sequence to ensure no collision with future generated barcodes.
UPDATE members 
SET barcode = 'WAD-' || CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS INTEGER) || '-' || lpad(CAST(nextval('member_barcode_seq') AS TEXT), 8, '0')
WHERE barcode IS NULL OR barcode = '' OR length(barcode) > 30;

-- 3. Enforce NOT NULL constraint
ALTER TABLE members ALTER COLUMN barcode SET NOT NULL;

-- 4. Enforce STRICT Uniqueness on Barcode
-- Drop potential existing constraints to standardise naming
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_member_barcode') THEN
        ALTER TABLE members DROP CONSTRAINT uk_member_barcode;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_members_barcode') THEN
        ALTER TABLE members DROP CONSTRAINT uq_members_barcode;
    END IF;
END $$;

ALTER TABLE members ADD CONSTRAINT uq_members_barcode UNIQUE (barcode);

-- 5. Create Performance Index for Barcode Scans/Search
DROP INDEX IF EXISTS idx_members_barcode;
CREATE INDEX idx_members_barcode ON members(barcode);

-- 6. Ensure Card Number is Unique but nullable (Existing constraint uk_member_card_number is likely correct, but let's double check/recreate if needed)
-- We leave uk_member_card_number as is, assuming it handles NULLs correctly (Postgres does).
