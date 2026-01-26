-- ============================================================================
-- Migration V105: Unify Provider Name Fields
-- ============================================================================
-- Purpose: Merge name_arabic and name_english into single 'name' field
-- Date: 2026-01-05
-- Author: System
-- 
-- Changes:
-- 1. Add new 'name' column
-- 2. Populate 'name' with name_arabic (prefer Arabic over English)
-- 3. Drop name_arabic and name_english columns
-- ============================================================================

-- Step 1: Add new 'name' column (nullable initially for migration)
ALTER TABLE providers 
ADD COLUMN name VARCHAR(200);

-- Step 2: Populate 'name' with existing data
-- Priority: name_arabic > name_english
UPDATE providers 
SET name = COALESCE(name_arabic, name_english, 'Unknown Provider');

-- Step 3: Make 'name' NOT NULL after data is populated
ALTER TABLE providers 
ALTER COLUMN name SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE providers 
DROP COLUMN IF EXISTS name_arabic,
DROP COLUMN IF EXISTS name_english;

-- ============================================================================
-- END OF MIGRATION V105
-- ============================================================================
