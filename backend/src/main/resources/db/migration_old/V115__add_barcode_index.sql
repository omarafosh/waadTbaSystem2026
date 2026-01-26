-- ================================================================
-- Migration: V115__add_barcode_index.sql
-- Purpose: Add optimized index for barcode search (Phase 3)
-- Date: 2026-01-09
-- ================================================================

-- Create index on barcode for instant lookup (<50ms requirement)
-- barcode is already UNIQUE constraint, but explicit index improves performance
CREATE INDEX IF NOT EXISTS idx_members_barcode 
ON members(barcode) 
WHERE barcode IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_members_barcode IS 'Optimized index for QR/barcode search - Phase 3 Unified Search';

-- Verify index creation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'members' 
        AND indexname = 'idx_members_barcode'
    ) THEN
        RAISE NOTICE 'Index idx_members_barcode created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create index idx_members_barcode';
    END IF;
END $$;
