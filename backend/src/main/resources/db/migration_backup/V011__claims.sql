-- ═══════════════════════════════════════════════════════════════════════════
-- V011: Claims Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create claims workflow tables
-- Dependencies: V004 (members), V007 (providers), V010 (pre_approvals)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- CLAIM ENUMS
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE claim_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'PENDING_DOCUMENTS',
    'APPROVED',
    'PARTIALLY_APPROVED',
    'REJECTED',
    'PAID',
    'CANCELLED'
);

CREATE TYPE claim_type AS ENUM (
    'INPATIENT',
    'OUTPATIENT',
    'DENTAL',
    'OPTICAL',
    'PHARMACY',
    'LAB',
    'IMAGING',
    'MATERNITY',
    'OTHER'
);

-- ───────────────────────────────────────────────────────────────────────────
-- CLAIMS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    claim_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Parties
    member_id BIGINT NOT NULL,
    provider_id BIGINT,
    employer_organization_id BIGINT,
    
    -- Pre-approval linkage
    pre_approval_id BIGINT,
    
    -- Claim details
    claim_type claim_type NOT NULL,
    status claim_status DEFAULT 'DRAFT',
    
    -- Dates
    service_date DATE NOT NULL,
    admission_date DATE,
    discharge_date DATE,
    submission_date TIMESTAMP,
    
    -- Clinical
    diagnosis_code VARCHAR(20),
    diagnosis_description TEXT,
    treatment_notes TEXT,
    
    -- Financials
    billed_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    approved_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    member_liability DECIMAL(15,2) DEFAULT 0,
    deductible_amount DECIMAL(15,2) DEFAULT 0,
    copay_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'KWD',
    
    -- Processing
    rejection_reason TEXT,
    adjudication_notes TEXT,
    
    -- Workflow
    submitted_by_user_id BIGINT,
    reviewed_by_user_id BIGINT,
    approved_by_user_id BIGINT,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    -- Metadata
    invoice_number VARCHAR(100),
    reference_number VARCHAR(100),
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_claims_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_claims_provider FOREIGN KEY (provider_id) REFERENCES providers(id),
    CONSTRAINT fk_claims_employer_org FOREIGN KEY (employer_organization_id) 
        REFERENCES organizations(id),
    CONSTRAINT fk_claims_preapproval FOREIGN KEY (pre_approval_id) 
        REFERENCES pre_approvals(id)
);

CREATE INDEX idx_claims_number ON claims(claim_number);
CREATE INDEX idx_claims_member ON claims(member_id);
CREATE INDEX idx_claims_provider ON claims(provider_id);
CREATE INDEX idx_claims_employer_org ON claims(employer_organization_id);
CREATE INDEX idx_claims_preapproval ON claims(pre_approval_id);
CREATE INDEX idx_claims_type ON claims(claim_type);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_service_date ON claims(service_date);
CREATE INDEX idx_claims_submission_date ON claims(submission_date);
CREATE INDEX idx_claims_active ON claims(active);

-- ───────────────────────────────────────────────────────────────────────────
-- CLAIM LINES TABLE (Line Items)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE claim_lines (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    service_id BIGINT,
    service_code VARCHAR(50),
    service_name VARCHAR(255),
    
    -- Quantities
    quantity INTEGER DEFAULT 1,
    
    -- Amounts
    unit_price DECIMAL(15,2),
    billed_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING',
    rejection_reason TEXT,
    
    -- Clinical
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cl_claim FOREIGN KEY (claim_id) 
        REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT fk_cl_service FOREIGN KEY (service_id) 
        REFERENCES medical_services(id)
);

CREATE INDEX idx_cl_claim ON claim_lines(claim_id);
CREATE INDEX idx_cl_service ON claim_lines(service_id);
CREATE INDEX idx_cl_status ON claim_lines(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V011
-- ═══════════════════════════════════════════════════════════════════════════
