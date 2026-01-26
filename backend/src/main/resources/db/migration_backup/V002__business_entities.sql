-- =============================================================================
-- V002: BUSINESS ENTITIES
-- =============================================================================
-- Created: 2025-12-28
-- Purpose: Core business entities - Companies, Employers, Members, Providers
-- Safe: Uses IF NOT EXISTS / IF EXISTS checks
-- =============================================================================

-- =============================================================================
-- 1. COMPANIES (DEPRECATED - READ ONLY)
-- =============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE companies IS 'DEPRECATED: Legacy TPA company table. Use organizations with type=TPA instead. READ ONLY.';

-- =============================================================================
-- 2. COMPANY_SETTINGS (DEPRECATED - LEGACY SUPPORT FOR FEATURE FLAGS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS company_settings (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    employer_id BIGINT NOT NULL,

    can_view_claims BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_visits BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit_members BOOLEAN NOT NULL DEFAULT TRUE,
    can_download_attachments BOOLEAN NOT NULL DEFAULT TRUE,

    ui_visibility JSONB,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT uk_company_employer_settings
        UNIQUE (company_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_company_settings_company
    ON company_settings(company_id);

CREATE INDEX IF NOT EXISTS idx_company_settings_employer
    ON company_settings(employer_id);

COMMENT ON TABLE company_settings IS
'DEPRECATED logically (legacy company scope) but schema matches CompanySettings entity. Feature flags per employer.';

-- =============================================================================
-- 3. EMPLOYERS (DEPRECATED - READ ONLY)
-- =============================================================================
CREATE TABLE IF NOT EXISTS employers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE employers IS 'DEPRECATED: Legacy employer table. Use organizations with type=EMPLOYER instead. READ ONLY.';

-- =============================================================================
-- 4. REVIEWER_COMPANIES (DEPRECATED - READ ONLY)
-- =============================================================================
CREATE TABLE IF NOT EXISTS reviewer_companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    medical_director VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    address VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE reviewer_companies IS 'DEPRECATED: Legacy reviewer company table. Use organizations with type=REVIEWER instead. READ ONLY.';

-- =============================================================================
-- 5. MEMBERS (Core beneficiary entity)
-- =============================================================================
CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
    
    -- Organization relationships (CANONICAL)
    employer_org_id BIGINT NOT NULL,           -- Organization (type=EMPLOYER)
    insurance_org_id BIGINT,                   -- Organization (type=INSURANCE/TPA)
    
    -- DEPRECATED: Legacy employer relationship
    employer_id BIGINT,
    
    -- Benefit Policy (Single Source of Truth for coverage)
    benefit_policy_id BIGINT,
    
    -- Personal Information
    full_name_arabic VARCHAR(200) NOT NULL,
    full_name_english VARCHAR(200),
    civil_id VARCHAR(50),                      -- OPTIONAL (Phase 1 Enterprise Fix)
    card_number VARCHAR(50) NOT NULL UNIQUE,   -- MANDATORY - System Generated BARCODE
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,               -- MALE, FEMALE
    marital_status VARCHAR(20),                -- SINGLE, MARRIED, DIVORCED, WIDOWED
    phone VARCHAR(20),
    email VARCHAR(255),
    address VARCHAR(500),
    nationality VARCHAR(100),
    
    -- Insurance Information
    policy_number VARCHAR(100),
    
    -- Employment Information
    employee_number VARCHAR(100),
    join_date DATE,
    occupation VARCHAR(100),
    
    -- Membership Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, SUSPENDED, TERMINATED, PENDING
    start_date DATE,
    end_date DATE,
    card_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BLOCKED, EXPIRED
    blocked_reason VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- QR Code & Eligibility
    qr_code_value VARCHAR(100) UNIQUE,
    eligibility_status BOOLEAN NOT NULL DEFAULT TRUE,
    eligibility_updated_at TIMESTAMP,
    
    -- Additional Information
    photo_url VARCHAR(500),
    notes VARCHAR(2000),
    
    -- Audit fields
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE members IS 'Core beneficiary/member entity with organization-based relationships';
COMMENT ON COLUMN members.employer_org_id IS 'Primary employer organization (CANONICAL - required)';
COMMENT ON COLUMN members.employer_id IS 'DEPRECATED - Legacy employer ID. Use employer_org_id instead.';
COMMENT ON COLUMN members.benefit_policy_id IS 'Single source of truth for coverage rules and limits';
COMMENT ON COLUMN members.card_number IS 'System-generated barcode: WAAD|MEMBER|{SEQUENCE}';

-- =============================================================================
-- 6. FAMILY_MEMBERS (DEPRECATED - REPLACED BY UNIFIED ARCHITECTURE)
-- =============================================================================
-- ⚠️ DEPRECATED: This table is OBSOLETE as of V200
-- Replacement: Members table with parent_id (self-referencing)
-- Migration: V200 migrates data and drops this table
-- DO NOT USE for new development
-- =============================================================================
CREATE TABLE IF NOT EXISTS family_members (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    relationship VARCHAR(20) NOT NULL,         -- WIFE, HUSBAND, SON, DAUGHTER, FATHER, MOTHER, BROTHER, SISTER
    full_name_arabic VARCHAR(200) NOT NULL,
    full_name_english VARCHAR(200),
    civil_id VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,               -- MALE, FEMALE
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, TERMINATED
    card_number VARCHAR(50),
    phone VARCHAR(20),
    notes VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE family_members IS 'Family members/dependents linked to primary members';

-- =============================================================================
-- 7. MEMBER_ATTRIBUTES (Flexible key-value storage)
-- =============================================================================
CREATE TABLE IF NOT EXISTS member_attributes (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    attribute_code VARCHAR(100) NOT NULL,      -- e.g., job_title, department, work_location
    attribute_value TEXT,
    source VARCHAR(50) DEFAULT 'MANUAL',       -- MANUAL, IMPORT, ODOO, API
    source_reference VARCHAR(200),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (member_id, attribute_code)
);

COMMENT ON TABLE member_attributes IS 'Flexible key-value attributes for members (Odoo compatibility)';
COMMENT ON COLUMN member_attributes.attribute_code IS 'Examples: job_title, department, grade, manager, cost_center';

-- =============================================================================
-- 8. PROVIDERS (Healthcare service providers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS providers (
    id BIGSERIAL PRIMARY KEY,
    name_arabic VARCHAR(200) NOT NULL,
    name_english VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    tax_number VARCHAR(50),
    city VARCHAR(100),
    address VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(100),
    provider_type VARCHAR(20) NOT NULL,        -- HOSPITAL, CLINIC, LAB, PHARMACY, RADIOLOGY
    active BOOLEAN NOT NULL DEFAULT TRUE,
    contract_start_date DATE,
    contract_end_date DATE,
    default_discount_rate DECIMAL(5, 2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

COMMENT ON TABLE providers IS 'Healthcare service providers (hospitals, clinics, labs, etc.)';

-- =============================================================================
-- 9. PROVIDER_CONTRACTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS provider_contracts (
    id BIGSERIAL PRIMARY KEY,
    contract_code VARCHAR(50) NOT NULL UNIQUE,
    contract_number VARCHAR(100),              -- Legacy field
    provider_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, EXPIRED, TERMINATED
    pricing_model VARCHAR(20) NOT NULL DEFAULT 'DISCOUNT', -- DISCOUNT, FIXED_PRICE, BUNDLED
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    discount_rate DECIMAL(5, 2),               -- Legacy field
    start_date DATE NOT NULL,
    end_date DATE,
    signed_date DATE,
    total_value DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'LYD',
    payment_terms VARCHAR(100),
    auto_renew BOOLEAN DEFAULT FALSE,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    notes VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

COMMENT ON TABLE provider_contracts IS 'Pricing agreements with healthcare providers';

-- =============================================================================
-- 10. CHRONIC_CONDITIONS (Medical conditions requiring pre-approval)
-- =============================================================================
CREATE TABLE IF NOT EXISTS chronic_conditions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description VARCHAR(2000),
    requires_pre_approval BOOLEAN NOT NULL DEFAULT TRUE,
    category VARCHAR(100),
    associated_service_codes VARCHAR(2000),    -- CRITICAL: This was missing in earlier migrations!
    notes VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE chronic_conditions IS 'Chronic medical conditions requiring special handling';
COMMENT ON COLUMN chronic_conditions.associated_service_codes IS 'CRITICAL FIX: Comma-separated service codes associated with this condition';

-- =============================================================================
-- 11. MEMBER_CHRONIC_CONDITIONS (Members with chronic conditions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS member_chronic_conditions (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    chronic_condition_id BIGINT NOT NULL,
    diagnosis_date DATE NOT NULL,
    extra_limit DECIMAL(15, 2),
    extra_limit_used DECIMAL(15, 2) DEFAULT 0.00,
    valid_from DATE,
    valid_until DATE,
    severity VARCHAR(20),                      -- MILD, MODERATE, SEVERE, CRITICAL
    requires_mandatory_pre_approval BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(2000),
    attachments VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (member_id, chronic_condition_id)
);

COMMENT ON TABLE member_chronic_conditions IS 'Links members to chronic conditions with extra coverage limits';

-- =============================================================================
-- VALIDATION
-- =============================================================================
DO $$
BEGIN
    -- Validate critical column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chronic_conditions' 
                   AND column_name = 'associated_service_codes') THEN
        RAISE EXCEPTION 'chronic_conditions.associated_service_codes column missing - migration failed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'members' 
                   AND column_name = 'employer_org_id') THEN
        RAISE EXCEPTION 'members.employer_org_id column missing - migration failed';
    END IF;
END $$;
