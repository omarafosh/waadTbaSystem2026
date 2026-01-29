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
    email_verified BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMP,
    
    -- Security
    failed_login_count INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP,
    
    -- Organization Context
    employer_id BIGINT,
    provider_id BIGINT,
    company_id BIGINT, -- Deprecated legacy field
    
    -- Permissions
    can_view_claims BOOLEAN DEFAULT TRUE,
    can_view_visits BOOLEAN DEFAULT TRUE,
    can_view_reports BOOLEAN DEFAULT TRUE,
    can_view_members BOOLEAN DEFAULT TRUE,
    can_view_benefit_policies BOOLEAN DEFAULT TRUE,
    
    allow_all_companies BOOLEAN DEFAULT FALSE,
    
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

-- 6. USER_PERMITTED_COMPANIES
CREATE TABLE user_permitted_companies (
    user_id BIGINT NOT NULL,
    employer_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, employer_id),
    CONSTRAINT fk_upc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
