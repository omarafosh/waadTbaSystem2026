-- ============================================================================
-- V061: Add User Profile Fields
-- ============================================================================
-- Purpose: Add profileImageUrl and passwordChangedAt to users table
-- Date: 2026-01-23
-- Author: System Architect
-- 
-- Changes:
-- 1. Add profile_image_url column (nullable) for avatar display
-- 2. Add password_changed_at column for password audit trail
-- 
-- Impact: ZERO - Nullable columns, no breaking changes
-- ============================================================================

-- Add profile image URL column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);

COMMENT ON COLUMN users.profile_image_url IS 'Profile image URL for avatar display (nullable). Falls back to first letter of name if null.';

-- Add password changed at timestamp
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

COMMENT ON COLUMN users.password_changed_at IS 'Timestamp when password was last changed. Used for password audit and expiration policies.';

-- Create index for password audit queries
CREATE INDEX IF NOT EXISTS idx_users_password_changed_at 
ON users(password_changed_at);

-- ============================================================================
-- VALIDATION
-- ============================================================================
-- Both columns should exist and be nullable
DO $$
BEGIN
    -- Validate profile_image_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profile_image_url'
        AND is_nullable = 'YES'
    ) THEN
        RAISE EXCEPTION 'Migration V061 validation failed: profile_image_url column missing or not nullable';
    END IF;

    -- Validate password_changed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_changed_at'
        AND is_nullable = 'YES'
    ) THEN
        RAISE EXCEPTION 'Migration V061 validation failed: password_changed_at column missing or not nullable';
    END IF;

    RAISE NOTICE 'V061 Migration validated successfully: User profile fields added';
END $$;
