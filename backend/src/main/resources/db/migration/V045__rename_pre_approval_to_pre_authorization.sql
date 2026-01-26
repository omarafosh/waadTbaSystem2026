-- ═══════════════════════════════════════════════════════════════════════════════
-- V045: Rename pre_approval_id to pre_authorization_id in claims table
-- ═══════════════════════════════════════════════════════════════════════════════
-- Date: 2026-01-15
-- Author: Architecture Overhaul
-- 
-- CONTEXT:
-- The system had two conflicting modules:
--   - modules/preauth (DEPRECATED) using PreApproval entity
--   - modules/preauthorization (CANONICAL) using PreAuthorization entity
-- 
-- This migration aligns the database column name with the canonical entity.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Rename the column in claims table
ALTER TABLE claims RENAME COLUMN pre_approval_id TO pre_authorization_id;

-- 2. Update foreign key constraint if it exists (safe drop and recreate)
ALTER TABLE claims DROP CONSTRAINT IF EXISTS fk_claims_pre_approval;
ALTER TABLE claims DROP CONSTRAINT IF EXISTS fk_claims_preapproval;
ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_pre_approval_id_fkey;

-- 3. Add new foreign key constraint with correct name
ALTER TABLE claims 
    ADD CONSTRAINT fk_claims_pre_authorization 
    FOREIGN KEY (pre_authorization_id) 
    REFERENCES pre_authorizations(id) 
    ON DELETE SET NULL;

-- 4. Update index if exists
DROP INDEX IF EXISTS idx_claims_pre_approval_id;
CREATE INDEX IF NOT EXISTS idx_claims_pre_authorization_id ON claims(pre_authorization_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (run after migration):
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'claims' AND column_name LIKE '%authorization%';
-- ═══════════════════════════════════════════════════════════════════════════════
