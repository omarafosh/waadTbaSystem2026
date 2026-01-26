-- V046: Visit-Centric Architecture - Enforce NOT NULL on visit_id
-- Date: 2026-01-15
-- Description: Make visit_id NOT NULL in claims and pre_authorizations tables
--              This enforces the Visit-Centric Architecture pattern where all
--              Claims and PreAuthorizations MUST be linked to a Visit.

-- ═══════════════════════════════════════════════════════════════════════════
-- CLAIMS TABLE: visit_id NOT NULL
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE claims ALTER COLUMN visit_id SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN claims.visit_id IS 'REQUIRED: Visit ID - Claims MUST be linked to a Visit (Visit-Centric Architecture)';

-- ═══════════════════════════════════════════════════════════════════════════
-- PRE_AUTHORIZATIONS TABLE: visit_id NOT NULL
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE pre_authorizations ALTER COLUMN visit_id SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pre_authorizations.visit_id IS 'REQUIRED: Visit ID - Pre-authorizations MUST be linked to a Visit (Visit-Centric Architecture)';

-- ═══════════════════════════════════════════════════════════════════════════
-- Add FK constraint for pre_authorizations.visit_id if missing
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_preauth_visit' AND conrelid = 'pre_authorizations'::regclass
    ) THEN
        ALTER TABLE pre_authorizations
            ADD CONSTRAINT fk_preauth_visit
            FOREIGN KEY (visit_id) REFERENCES visits(id);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Add index on pre_authorizations.visit_id if missing
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_preauth_visit_id ON pre_authorizations(visit_id);
