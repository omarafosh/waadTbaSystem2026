-- ═══════════════════════════════════════════════════════════════════════════
-- V027: Fix column types in eligibility_checks table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Fix wrong column type [reasons] from jsonb to text
-- Fixes: wrong column type encountered in column [reasons]
-- ═══════════════════════════════════════════════════════════════════════════

-- First drop the GIN index on reasons column (created in V018 as idx_ec_reasons)
DROP INDEX IF EXISTS idx_ec_reasons;

-- Change reasons column from JSONB to TEXT
ALTER TABLE eligibility_checks 
ALTER COLUMN reasons TYPE TEXT USING reasons::TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V027
-- ═══════════════════════════════════════════════════════════════════════════
