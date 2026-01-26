-- =============================================================================
-- V001: CORE INFRASTRUCTURE
-- =============================================================================
-- Created: 2025-12-28
-- Purpose: Core RBAC (Users, Roles, Permissions), Organizations, Audit Logs
-- Safe: Uses IF NOT EXISTS / IF EXISTS checks
-- =============================================================================

-- =============================================================================
-- 1. ORGANIZATIONS (multi-tenant foundation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    code VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- EMPLOYER, TPA, REVIEWER, INSURANCE
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE organizations IS 'Multi-tenant organizations (employers, TPA, reviewers, insurance companies)';
COMMENT ON COLUMN organizations.type IS 'Enum: EMPLOYER, TPA, REVIEWER, INSURANCE';

-- =============================================================================
-- 2. RBAC - PERMISSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    module VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE permissions IS 'System permissions (e.g., VIEW_MEMBERS, CREATE_CLAIMS)';

-- =============================================================================
-- 3. RBAC - ROLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE roles IS 'User roles (SUPER_ADMIN, EMPLOYER_ADMIN, MEDICAL_REVIEWER, etc.)';

-- =============================================================================
-- 4. RBAC - ROLE_PERMISSIONS (Many-to-Many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between roles and permissions';

-- =============================================================================
-- 5. RBAC - USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    employer_id BIGINT,                    -- For EMPLOYER_ADMIN users
    company_id BIGINT,                     -- DEPRECATED - kept for backward compatibility
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON COLUMN users.employer_id IS 'Links EMPLOYER_ADMIN users to their employer organization';
COMMENT ON COLUMN users.company_id IS 'DEPRECATED - Use Organization entities instead. Kept for backwards compatibility.';

-- =============================================================================
-- 6. RBAC - USER_ROLES (Many-to-Many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles';

-- =============================================================================
-- 7. AUDIT_LOGS (comprehensive system audit trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT
);

COMMENT ON TABLE audit_logs IS 'System-wide audit trail for all user actions';
COMMENT ON COLUMN audit_logs.action IS 'Action type: USER_CREATED, USER_UPDATED, ROLE_ASSIGNED, etc.';

-- =============================================================================
-- 8. PASSWORD_RESET_TOKENS
-- =============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens for user password recovery';

-- =============================================================================
-- VALIDATION
-- =============================================================================
-- Ensure organizations table exists with required columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'type') THEN
        RAISE EXCEPTION 'organizations.type column missing - migration failed';
    END IF;
END $$;
