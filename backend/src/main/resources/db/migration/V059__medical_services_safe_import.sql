-- ══════════════════════════════════════════════════════════════════════════════
-- V059: Medical Services Safe Import Mode
-- ══════════════════════════════════════════════════════════════════════════════
-- Purpose: Support Name-Only Excel Imports by introducing DRAFT status
-- Date: 2026-01-22
-- Author: Senior Architect
-- 
-- CHANGES:
-- 1. Add status column (ACTIVE, DRAFT, ARCHIVED)
-- 2. Make category_id optional (nullable) to support DRAFT state
-- 3. Migrate existing data to ACTIVE status
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Add status column
ALTER TABLE medical_services 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- 2. Update existing records to ACTIVE
UPDATE medical_services SET status = 'ACTIVE' WHERE status IS NULL;

-- 3. Make column NOT NULL after population
ALTER TABLE medical_services 
ALTER COLUMN status SET NOT NULL;

-- 4. Relax category_id constraint (Drop NOT NULL)
-- This allows services to be imported without category (DRAFT mode)
ALTER TABLE medical_services 
ALTER COLUMN category_id DROP NOT NULL;

-- 5. Add helpful comment
COMMENT ON COLUMN medical_services.status IS 
'Lifecycle status: DRAFT (Name-only import, unusable), ACTIVE (Ready for use), ARCHIVED (Soft deleted)';
