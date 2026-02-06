-- ═══════════════════════════════════════════════════════════════════════════
-- V1.01: Security Tables (RBAC)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ROLES
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. USERS
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    profile_image_url VARCHAR(255),
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Validation
    email_verified BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMP,
    
    -- Security
    failed_login_count INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP,
    
    -- Organization Context
    company_id BIGINT,
    employer_id BIGINT,
    provider_id BIGINT,
    
    -- Access Flags (Restored)
    allow_all_companies BOOLEAN DEFAULT FALSE,
    can_view_members BOOLEAN DEFAULT TRUE,
    can_view_benefit_policies BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 3. PERMISSIONS
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_ar VARCHAR(100),
    description VARCHAR(500),
    description_ar VARCHAR(500),
    module VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 4. USER_ROLES (Many-to-Many)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 5. ROLE_PERMISSIONS (Many-to-Many)
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 6. USER_PERMITTED_ORGANIZATIONS (Moved to V1.02)
-- Table definition moved to V1.02 to ensure 'organizations' table exists first.

-- 7. SEED ROLES (Standard Roles)
INSERT INTO roles (name, description, active) VALUES
('SUPER_ADMIN', 'مدير النظام - صلاحيات كاملة', true),
('INSURANCE_ADMIN', 'مدير التأمين - إدارة التغطية والعقود', true),
('PROVIDER', 'مقدم الخدمة - إدارة الموافقات والمطالبات', true),
('REVIEWER', 'المراجع - مراجعة واعتماد المطالبات', true),
('ACCOUNTANT', 'المحاسب - الإدارة المالية والتسويات', true),
('BENEFICIARY', 'المستفيد', true);

-- Note: Permissions and Role Assignments are managed in V1.20__seed_default_role_permissions.sql
-- This ensures a clean separation of Schema (here) and Security Configuration (V1.20).


