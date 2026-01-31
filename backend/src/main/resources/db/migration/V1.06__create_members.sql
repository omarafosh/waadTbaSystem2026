-- ═══════════════════════════════════════════════════════════════════════════
-- V1.06: Members and Documents
-- ═══════════════════════════════════════════════════════════════════════════

-- 0. SEQUENCES
CREATE SEQUENCE IF NOT EXISTS member_barcode_seq START WITH 1000 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_smart_card_random_id START WITH 100000 INCREMENT BY 1;

-- 1. MEMBERS
CREATE TABLE members (
    id BIGSERIAL PRIMARY KEY,
    
    -- Hierarchy (Principal/Dependent)
    parent_id BIGINT,
    relationship VARCHAR(20), -- WIFE, SON, DAUGHTER...
    
    -- Organization & Coverage
    employer_org_id BIGINT NOT NULL,
    employer_id BIGINT, -- Legacy field
    insurance_org_id BIGINT,
    benefit_policy_id BIGINT,
    
    -- Identification
    full_name VARCHAR(200) NOT NULL,
    card_number VARCHAR(50),      -- e.g. 1001-01
    barcode VARCHAR(100) UNIQUE,  -- Only for Principal
    national_number VARCHAR(50),
    civil_id VARCHAR(50), -- Deprecated
    
    -- Enterprise Identification
    provider_code VARCHAR(3),
    company_code VARCHAR(20),
    relationship_code VARCHAR(5),
    internal_id_part VARCHAR(20),
    is_smart_card BOOLEAN DEFAULT FALSE,
    card_status VARCHAR(20) DEFAULT 'ACTIVE',
    card_activated_at TIMESTAMP,
    secondary_status VARCHAR(50),
    
    -- Personal Info
    birth_date DATE,
    gender VARCHAR(10),
    marital_status VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address VARCHAR(500),
    nationality VARCHAR(100),
    photo_url VARCHAR(500),
    profile_photo_path VARCHAR(1000),
    
    -- Employment
    employee_number VARCHAR(100),
    join_date DATE,
    occupation VARCHAR(100),
    policy_number VARCHAR(100), -- Legacy string field
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    blocked_reason VARCHAR(500),
    
    start_date DATE,
    end_date DATE,
    
    -- Eligibility Cache
    eligibility_status BOOLEAN DEFAULT TRUE,
    eligibility_updated_at TIMESTAMP,
    
    notes VARCHAR(2000),
    
    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    CONSTRAINT fk_members_parent FOREIGN KEY (parent_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_members_employer FOREIGN KEY (employer_org_id) REFERENCES organizations(id),
    CONSTRAINT fk_members_insurance FOREIGN KEY (insurance_org_id) REFERENCES organizations(id),
    CONSTRAINT fk_members_policy FOREIGN KEY (benefit_policy_id) REFERENCES benefit_policies(id),
    
    CONSTRAINT uk_members_card_number UNIQUE (card_number)
);

CREATE INDEX idx_members_parent ON members(parent_id);
CREATE INDEX idx_members_employer ON members(employer_org_id);
CREATE INDEX idx_members_barcode ON members(barcode);
CREATE INDEX idx_members_full_name ON members(full_name);

-- 2. MEMBER ATTRIBUTES (Flexible fields)
CREATE TABLE member_attributes (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    attribute_code VARCHAR(100) NOT NULL,
    attribute_value TEXT,
    source VARCHAR(50) DEFAULT 'MANUAL',
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_ma_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT uk_ma_code UNIQUE (member_id, attribute_code)
);

-- 3. MEMBER DOCUMENTS
CREATE TABLE member_documents (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- PHOTO, NATIONAL_ID...
    
    file_path VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    uploaded_at TIMESTAMP NOT NULL,
    uploaded_by VARCHAR(255),
    
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by VARCHAR(255),
    notes TEXT,
    
    CONSTRAINT fk_md_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
