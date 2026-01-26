-- ═══════════════════════════════════════════════════════════════════════════
-- V030: Add missing columns to icd_codes table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add columns required by IcdCode JPA Entity
-- ═══════════════════════════════════════════════════════════════════════════

-- Add description_en column
ALTER TABLE icd_codes ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Add sub_category column
ALTER TABLE icd_codes ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);

-- Add notes column
ALTER TABLE icd_codes ADD COLUMN IF NOT EXISTS notes VARCHAR(2000);

-- Add version column
ALTER TABLE icd_codes ADD COLUMN IF NOT EXISTS version VARCHAR(20);

-- Add description_ar column (rename description to description_ar if exists)
ALTER TABLE icd_codes ADD COLUMN IF NOT EXISTS description_ar VARCHAR(500);

-- Copy data from description to description_ar if needed
UPDATE icd_codes SET description_ar = description WHERE description_ar IS NULL AND description IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V030
-- ═══════════════════════════════════════════════════════════════════════════
