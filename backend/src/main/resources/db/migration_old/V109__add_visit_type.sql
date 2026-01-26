-- =============================================================================
-- Migration: V109 - Add visit_type column to visits table
-- Date: 2026-01-08
-- Author: GitHub Copilot
-- Description: Add visit_type column for service location classification
-- =============================================================================

-- 1. Add visit_type column if not exists
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS visit_type VARCHAR(30) DEFAULT 'OUTPATIENT';

-- 2. Update existing rows to have default
UPDATE visits
SET visit_type = 'OUTPATIENT'
WHERE visit_type IS NULL;

-- 3. Set NOT NULL constraint
ALTER TABLE visits
ALTER COLUMN visit_type SET NOT NULL;

-- 4. Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_visits_visit_type
ON visits(visit_type);

-- 5. Add comment for documentation
COMMENT ON COLUMN visits.visit_type IS 'Type of visit/service location: EMERGENCY, OUTPATIENT, INPATIENT, ROUTINE, FOLLOW_UP, PREVENTIVE, SPECIALIZED, HOME_CARE, TELECONSULTATION, DAY_SURGERY';