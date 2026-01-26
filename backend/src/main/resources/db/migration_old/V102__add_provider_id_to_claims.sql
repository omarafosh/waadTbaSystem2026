-- ============================================================================
-- Migration: V102 - Add provider_id to claims table
-- Date: 2026-01-05
-- Description: Adds provider_id column to claims table for PROVIDER role filtering
--              Global Best Practice: Allows providers to see only their own claims
-- ============================================================================

-- Add provider_id column to claims table
ALTER TABLE claims 
ADD COLUMN provider_id BIGINT;

-- Add comment explaining the field
COMMENT ON COLUMN claims.provider_id IS 'Links claim to the healthcare provider who created it';

-- Add foreign key constraint to providers table
ALTER TABLE claims
ADD CONSTRAINT fk_claims_provider_id 
FOREIGN KEY (provider_id) 
REFERENCES providers(id)
ON DELETE SET NULL;  -- Keep claim history even if provider is deleted

-- Create index for performance (filtering by provider_id will be common)
CREATE INDEX idx_claims_provider_id ON claims(provider_id);

-- Create composite index for common query patterns
-- (provider_id + status) for filtering provider's claims by status
CREATE INDEX idx_claims_provider_status ON claims(provider_id, status) 
WHERE active = true;

-- Create composite index for date-based queries
-- (provider_id + created_at) for sorting provider's claims by date
CREATE INDEX idx_claims_provider_created ON claims(provider_id, created_at DESC) 
WHERE active = true;

-- ============================================================================
-- Optional: Update existing claims to set provider_id based on visit data
-- ============================================================================
-- If visits table has provider_id and claims have visit_id:
UPDATE claims c
SET provider_id = v.provider_id
FROM visits v
WHERE c.visit_id = v.id
  AND c.provider_id IS NULL
  AND v.provider_id IS NOT NULL;

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================
-- SELECT 
--   COUNT(*) as total_claims,
--   COUNT(provider_id) as claims_with_provider,
--   COUNT(*) - COUNT(provider_id) as claims_without_provider
-- FROM claims WHERE active = true;
