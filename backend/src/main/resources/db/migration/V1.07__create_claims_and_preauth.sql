-- ═══════════════════════════════════════════════════════════════════════════
-- V1.07: Claims and Pre-Authorizations
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. PRE-AUTHORIZATIONS
CREATE TABLE pre_authorizations (
    id BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    visit_type VARCHAR(20), -- OUTPATIENT, EMERGENCY, etc. (Context)
    
    -- Actors
    provider_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    employer_org_id BIGINT,    -- Optional Link (Snapshot)
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    
    -- Coverage & Financials
    diagnosis TEXT,
    requested_amount DECIMAL(15, 2),
    approved_amount DECIMAL(15, 2),
    
    -- Review
    reviewer_notes TEXT,
    rejection_reason TEXT,
    
    -- Validity
    approval_code VARCHAR(50), -- Generated if approved
    valid_until DATE,
    
    -- Audit
    submitted_at TIMESTAMP,
    submitted_by VARCHAR(100),
    decided_at TIMESTAMP,
    decided_by VARCHAR(100),
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_pa_provider FOREIGN KEY (provider_id) REFERENCES providers(id),
    CONSTRAINT fk_pa_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_pa_employer FOREIGN KEY (employer_org_id) REFERENCES organizations(id)
);

CREATE INDEX idx_pa_provider ON pre_authorizations(provider_id);
CREATE INDEX idx_pa_member ON pre_authorizations(member_id);
CREATE INDEX idx_pa_status ON pre_authorizations(status);

-- 2. PRE-AUTH ITEMS (Services requested)
CREATE TABLE pre_auth_items (
    id BIGSERIAL PRIMARY KEY,
    pre_auth_id BIGINT NOT NULL,
    
    medical_service_id BIGINT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    
    status VARCHAR(20) DEFAULT 'PENDING', -- APPROVED, REJECTED, PARTIAL
    notes TEXT,
    
    CONSTRAINT fk_pai_auth FOREIGN KEY (pre_auth_id) REFERENCES pre_authorizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_pai_service FOREIGN KEY (medical_service_id) REFERENCES medical_services(id)
);

-- 3. CLAIMS
CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    
    -- Optimistic Locking
    version BIGINT,
    
    -- Actors
    member_id BIGINT NOT NULL,
    insurance_org_id BIGINT,
    provider_id BIGINT NOT NULL,
    
    -- Relationships
    pre_authorization_id BIGINT,
    visit_id BIGINT NOT NULL,
    
    -- Provider Info (Snapshot)
    provider_name VARCHAR(255),
    doctor_name VARCHAR(255),
    
    -- Diagnosis
    diagnosis_code VARCHAR(20),
    diagnosis_description VARCHAR(500),
    service_date DATE,
    
    -- Financials  (Contract Driven)
    requested_amount DECIMAL(15, 2) NOT NULL,
    approved_amount DECIMAL(15, 2),
    difference_amount DECIMAL(15, 2),
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    reviewer_comment TEXT,
    reviewed_at TIMESTAMP,
    
    -- Financial Snapshot (Phase MVP)
    patient_copay DECIMAL(15, 2),
    net_provider_amount DECIMAL(15, 2),
    copay_percent DECIMAL(5, 2),
    deductible_applied DECIMAL(15, 2),
    
    -- Settlement
    payment_reference VARCHAR(100),
    settled_at TIMESTAMP,
    settlement_notes TEXT,
    
    -- SLA Tracking
    expected_completion_date DATE,
    actual_completion_date DATE,
    within_sla BOOLEAN,
    business_days_taken INTEGER,
    sla_days_configured INTEGER,
    
    -- Counts
    service_count INTEGER,
    attachments_count INTEGER,
    
    -- Audit & Meta
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    CONSTRAINT fk_claims_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_claims_insurance FOREIGN KEY (insurance_org_id) REFERENCES organizations(id),
    CONSTRAINT fk_claims_auth FOREIGN KEY (pre_authorization_id) REFERENCES pre_authorizations(id)
    -- Visit FK would usually be here but visits table might be created later or same time. 
    -- Assuming visits table exists or we add FK later. For now, matching entity structure.
);

CREATE INDEX idx_claims_provider ON claims(provider_id);
CREATE INDEX idx_claims_member ON claims(member_id);
CREATE INDEX idx_claims_status ON claims(status);

-- 4. CLAIM LINES (Services)
CREATE TABLE claim_lines (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    
    medical_service_id BIGINT NOT NULL,
    service_name VARCHAR(255), -- Snapshot
    
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    
    patient_share DECIMAL(15, 2),
    payer_share DECIMAL(15, 2),
    
    status VARCHAR(20) DEFAULT 'SUBMITTED',
    rejection_reason VARCHAR(255),
    
    requires_pa BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_cl_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT fk_cl_service FOREIGN KEY (medical_service_id) REFERENCES medical_services(id)
);

-- 5. ATTACHMENTS (Generic for Claims & PreAuth)
CREATE TABLE medical_attachments (
    id BIGSERIAL PRIMARY KEY,
    
    -- Polymorphic link (simulated)
    claim_id BIGINT,
    pre_auth_id BIGINT,
    
    file_name VARCHAR(255),
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    
    uploaded_at TIMESTAMP,
    uploaded_by VARCHAR(100),
    
    CONSTRAINT fk_att_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_auth FOREIGN KEY (pre_auth_id) REFERENCES pre_authorizations(id) ON DELETE CASCADE
);
