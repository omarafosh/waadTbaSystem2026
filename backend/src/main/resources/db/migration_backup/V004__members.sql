-- ═══════════════════════════════════════════════════════════════════════════
-- V004: Members Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create members table with employer and benefit_policy linkage
-- Dependencies: V001-V003 (organizations, employers, benefit_policies)
-- CRITICAL: FK to benefit_policies MUST exist before members
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- MEMBER ENUMS
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE member_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'PENDING'
);

CREATE TYPE member_gender AS ENUM (
    'MALE',
    'FEMALE'
);

CREATE TYPE marital_status AS ENUM (
    'SINGLE',
    'MARRIED',
    'DIVORCED',
    'WIDOWED'
);

CREATE TYPE card_status AS ENUM (
    'ACTIVE',
    'BLOCKED',
    'EXPIRED',
    'PENDING',
    'CANCELLED'
);

-- ───────────────────────────────────────────────────────────────────────────
-- MEMBERS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE members (
    id BIGSERIAL PRIMARY KEY,
    card_number VARCHAR(50) NOT NULL UNIQUE,
    civil_id VARCHAR(20),
    
    -- Personal information
    full_name_arabic VARCHAR(255) NOT NULL,
    full_name_english VARCHAR(255),
    birth_date DATE,
    gender member_gender,
    marital_status marital_status,
    nationality VARCHAR(50),
    
    -- Contact information
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    
    -- Employment relationship
    employer_id BIGINT,
    employer_organization_id BIGINT NOT NULL,
    employee_number VARCHAR(50),
    join_date DATE,
    occupation VARCHAR(100),
    department VARCHAR(100),
    
    -- Insurance coverage (via BenefitPolicy ONLY)
    benefit_policy_id BIGINT,
    policy_number VARCHAR(50),
    
    -- Membership dates
    start_date DATE,
    end_date DATE,
    
    -- Status
    status member_status DEFAULT 'ACTIVE',
    card_status card_status DEFAULT 'ACTIVE',
    blocked_reason TEXT,
    eligibility_status VARCHAR(50),
    
    -- Card features
    qr_code_value VARCHAR(500),
    photo_url VARCHAR(500),
    
    -- Metadata
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_members_employer FOREIGN KEY (employer_id) 
        REFERENCES employers(id),
    CONSTRAINT fk_members_employer_org FOREIGN KEY (employer_organization_id) 
        REFERENCES organizations(id),
    CONSTRAINT fk_members_benefit_policy FOREIGN KEY (benefit_policy_id) 
        REFERENCES benefit_policies(id)
);

CREATE INDEX idx_members_card_number ON members(card_number);
CREATE INDEX idx_members_civil_id ON members(civil_id);
CREATE INDEX idx_members_name_ar ON members(full_name_arabic);
CREATE INDEX idx_members_employer ON members(employer_id);
CREATE INDEX idx_members_employer_org ON members(employer_organization_id);
CREATE INDEX idx_members_benefit_policy ON members(benefit_policy_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_active ON members(active);
CREATE INDEX idx_members_card_status ON members(card_status);
CREATE INDEX idx_members_eligibility ON members(eligibility_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V004
-- ═══════════════════════════════════════════════════════════════════════════
