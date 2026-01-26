-- ═══════════════════════════════════════════════════════════════════════════
-- V019: Fix User-Roles Schema - PostgreSQL
-- TBA WAAD System - RBAC Schema Fix
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add user_roles join table for Many-to-Many relationship
--          Add missing columns to users table
-- Dependencies: V001 (users, roles tables)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ADD MISSING COLUMNS TO USERS TABLE
-- ───────────────────────────────────────────────────────────────────────────

-- Add is_active column (entity expects this name, migration has 'active')
-- We'll add it as alias-compatible
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Sync is_active with active column
UPDATE users SET is_active = active WHERE is_active IS NULL;

-- Add email_verified column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add company_id column (legacy, but entity references it)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id BIGINT;

-- ───────────────────────────────────────────────────────────────────────────
-- CREATE USER_ROLES JOIN TABLE (Many-to-Many)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- ───────────────────────────────────────────────────────────────────────────
-- MIGRATE EXISTING role_id DATA TO user_roles TABLE
-- ───────────────────────────────────────────────────────────────────────────

-- Insert existing role assignments from role_id column into user_roles
INSERT INTO user_roles (user_id, role_id)
SELECT id, role_id FROM users WHERE role_id IS NOT NULL
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V019
-- ═══════════════════════════════════════════════════════════════════════════
