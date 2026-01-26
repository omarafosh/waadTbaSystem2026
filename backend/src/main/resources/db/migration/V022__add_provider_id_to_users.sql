-- ============================================================================
-- Migration: Add provider_id to users table
-- Version: V101
-- Description: Add provider_id column to link PROVIDER role users to their healthcare provider
-- Author: System
-- Date: 2026-01-04
-- ============================================================================

-- Add provider_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS provider_id BIGINT;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_provider
FOREIGN KEY (provider_id) 
REFERENCES providers(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);

-- Add comment for documentation
COMMENT ON COLUMN users.provider_id IS 'Links PROVIDER role users to their healthcare provider. Used for data filtering and access control.';

-- ============================================================================
-- Validation Query (for manual verification)
-- ============================================================================
-- SELECT 
--   u.id, 
--   u.username, 
--   r.name as role,
--   u.employer_id,
--   u.provider_id,
--   p.name_arabic as provider_name
-- FROM users u
-- LEFT JOIN user_roles ur ON u.id = ur.user_id
-- LEFT JOIN roles r ON ur.role_id = r.id
-- LEFT JOIN providers p ON u.provider_id = p.id
-- WHERE r.name = 'PROVIDER';
