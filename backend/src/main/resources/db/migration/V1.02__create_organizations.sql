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

-- 3. COMPANY_SETTINGS (Feature flags per employer-company relation)
CREATE TABLE company_settings (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,   -- Organization (TPA/Insurance)
    employer_id BIGINT NOT NULL,  -- Organization (Employer)
    
    -- Feature Flags
    can_view_claims BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_visits BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit_members BOOLEAN NOT NULL DEFAULT TRUE,
    can_download_attachments BOOLEAN NOT NULL DEFAULT TRUE,
    
    ui_visibility JSONB,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT uk_company_employer UNIQUE (company_id, employer_id),
    CONSTRAINT fk_cs_company FOREIGN KEY (company_id) REFERENCES organizations(id),
    CONSTRAINT fk_cs_employer FOREIGN KEY (employer_id) REFERENCES organizations(id)
);
