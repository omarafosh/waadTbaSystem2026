-- ========================================================================
-- Migration: Add Custom Permissions for EMPLOYER Users
-- Date: 2026-01-05
-- Description: Add fine-grained permission fields for EMPLOYER_ADMIN and EMPLOYER_USER roles
-- ========================================================================

-- Add custom permission columns to users table
-- These columns control what EMPLOYER users can see/do in the system
-- Default: TRUE (all permissions enabled by default)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS can_view_claims BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_view_visits BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_view_members BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_view_benefit_policies BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.can_view_claims IS 'Can view/manage claims - configurable per EMPLOYER user';
COMMENT ON COLUMN users.can_view_visits IS 'Can view/manage visits - configurable per EMPLOYER user';
COMMENT ON COLUMN users.can_view_reports IS 'Can view reports - configurable per EMPLOYER user';
COMMENT ON COLUMN users.can_view_members IS 'Can view/manage members - configurable per EMPLOYER user';
COMMENT ON COLUMN users.can_view_benefit_policies IS 'Can view benefit policies - configurable per EMPLOYER user';

-- Update existing EMPLOYER users to have all permissions enabled (backward compatibility)
UPDATE users SET
    can_view_claims = TRUE,
    can_view_visits = TRUE,
    can_view_reports = TRUE,
    can_view_members = TRUE,
    can_view_benefit_policies = TRUE
WHERE employer_id IS NOT NULL
  AND (can_view_claims IS NULL OR can_view_visits IS NULL OR can_view_reports IS NULL OR can_view_members IS NULL OR can_view_benefit_policies IS NULL);

-- Verify the changes
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN employer_id IS NOT NULL THEN 1 END) as employer_users,
    COUNT(CASE WHEN can_view_claims = TRUE THEN 1 END) as users_can_view_claims,
    COUNT(CASE WHEN can_view_visits = TRUE THEN 1 END) as users_can_view_visits,
    COUNT(CASE WHEN can_view_reports = TRUE THEN 1 END) as users_can_view_reports,
    COUNT(CASE WHEN can_view_members = TRUE THEN 1 END) as users_can_view_members,
    COUNT(CASE WHEN can_view_benefit_policies = TRUE THEN 1 END) as users_can_view_benefit_policies
FROM users;
