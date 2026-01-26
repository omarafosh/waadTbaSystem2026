-- ═══════════════════════════════════════════════════════════════════════════
-- V001: Core Schema - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create core enums, roles, users, and organizations tables
-- Dependencies: None (first migration)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ───────────────────────────────────────────────────────────────────────────

-- Organization type enum
CREATE TYPE organization_type AS ENUM (
    'EMPLOYER',
    'TPA',
    'PROVIDER'
);

-- User status enum
CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'LOCKED',
    'PENDING'
);

-- ───────────────────────────────────────────────────────────────────────────
-- ROLES TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(100),
    description VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_active ON roles(active);

-- ───────────────────────────────────────────────────────────────────────────
-- PERMISSIONS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description VARCHAR(255),
    module VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_module ON permissions(module);

-- ───────────────────────────────────────────────────────────────────────────
-- ROLE_PERMISSIONS JOIN TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ───────────────────────────────────────────────────────────────────────────
-- ORGANIZATIONS TABLE (Unified Organization Model)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    type organization_type NOT NULL,
    parent_id BIGINT,
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    logo_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_org_parent FOREIGN KEY (parent_id) REFERENCES organizations(id),
    CONSTRAINT uk_org_code_type UNIQUE (code, type)
);

CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_parent ON organizations(parent_id);
CREATE INDEX idx_organizations_active ON organizations(active);

-- ───────────────────────────────────────────────────────────────────────────
-- USERS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    full_name_ar VARCHAR(100),
    phone VARCHAR(30),
    status user_status DEFAULT 'ACTIVE',
    role_id BIGINT,
    employer_id BIGINT,
    organization_id BIGINT,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    password_changed_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_employer ON users(employer_id);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_status ON users(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V001
-- ═══════════════════════════════════════════════════════════════════════════
