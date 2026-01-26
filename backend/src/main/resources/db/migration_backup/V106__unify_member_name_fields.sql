-- ============================================================================
-- Migration V106: Unify Member Name Fields
-- ============================================================================
-- Purpose: Merge full_name_arabic and full_name_english into single 'full_name' field
-- Date: 2026-01-06
-- Author: System
-- 
-- Changes:
-- 1. Add new 'full_name' column
-- 2. Populate 'full_name' with full_name_arabic (prefer Arabic over English)
-- 3. Drop full_name_arabic and full_name_english columns
-- ============================================================================

-- Step 1: Add new 'full_name' column (nullable initially for migration)
ALTER TABLE members 
ADD COLUMN full_name VARCHAR(200);

-- Step 2: Populate 'full_name' with existing data
-- Priority: full_name_arabic > full_name_english
UPDATE members 
SET full_name = COALESCE(full_name_arabic, full_name_english, 'Unknown Member');

-- Step 3: Make 'full_name' NOT NULL after data is populated
ALTER TABLE members 
ALTER COLUMN full_name SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE members 
DROP COLUMN IF EXISTS full_name_arabic,
DROP COLUMN IF EXISTS full_name_english;

-- ============================================================================
-- END OF MIGRATION V106
-- ============================================================================
