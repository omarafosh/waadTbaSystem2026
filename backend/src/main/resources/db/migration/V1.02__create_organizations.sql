-- ═══════════════════════════════════════════════════════════════════════════
-- V1.02: Organizations
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ORGANIZATIONS (Replaces companies, employers, reviewers)
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    barcode_prefix VARCHAR(20) DEFAULT 'WAAD',
    type VARCHAR(50) NOT NULL, -- INSURANCE, TPA, EMPLOYER, REVIEWER, BROKER
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Branding & Info
    logo_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    website VARCHAR(200),
    tax_number VARCHAR(50),
    
    -- Settings
    is_default BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'LYD',
    
    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_code ON organizations(code);

-- 2. COMPANIES (Legacy Table Support)
-- Required by CompanyController and Company.java
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Branding
    logo_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    website VARCHAR(200),
    business_type VARCHAR(100),
    tax_number VARCHAR(50),
    currency VARCHAR(10),
    
    -- Settings
    card_number_format VARCHAR(200),
    font_family VARCHAR(50),
    font_size INTEGER DEFAULT 12,
    barcode_prefix VARCHAR(20) DEFAULT 'WAAD',
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 3. COMPANY_SETTINGS (Relation management between TPA/Insurance and Employer)
CREATE TABLE company_settings (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,   -- Organization (TPA/Insurance)
    employer_id BIGINT NOT NULL,  -- Organization (Employer)
    
    -- Feature Flags (UI Settings - NOT RBAC)
    ui_visibility JSONB,
    
    -- Consolidated Access Flags (from V1.10)
    can_view_claims BOOLEAN DEFAULT FALSE,
    can_view_visits BOOLEAN DEFAULT FALSE,
    can_edit_members BOOLEAN DEFAULT TRUE,
    can_download_attachments BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT uk_company_employer UNIQUE (company_id, employer_id),
    CONSTRAINT fk_cs_company FOREIGN KEY (company_id) REFERENCES organizations(id),
    CONSTRAINT fk_cs_employer FOREIGN KEY (employer_id) REFERENCES organizations(id)
);

-- 6. USER_PERMITTED_ORGANIZATIONS (Moved here from V1.01)
CREATE TABLE user_permitted_organizations (
    user_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, organization_id),
    CONSTRAINT fk_upo_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_upo_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 4. SEED DATA
-- SYSTEM OWNER (WAAD)
INSERT INTO organizations (name, code, type, active, is_default, currency, created_at, updated_at) 
VALUES ('WAAD Insurance TPA', 'WAAD-TPA-001', 'TPA', true, true, 'LYD', NOW(), NOW()) 
ON CONFLICT (code) DO NOTHING;

-- DEMO INSURANCE COMPANY
INSERT INTO organizations (name, code, type, active, is_default, currency, created_at, updated_at) 
VALUES ('Libya Insurance Company', 'LIC-001', 'INSURANCE', true, false, 'LYD', NOW(), NOW()) 
ON CONFLICT (code) DO NOTHING;

-- EMPLOYER: جليانة
INSERT INTO organizations (name, code, type, active, archived, barcode_prefix, created_at, updated_at) 
VALUES ('جليانة', 'EMP-01', 'EMPLOYER', true, false, 'WAAD', NOW(), NOW()) 
ON CONFLICT (code) DO NOTHING;

