-- ═══════════════════════════════════════════════════════════════════════════
-- V052: Recreate Pre-Authorizations Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- The original table has completely different structure from Entity

DROP TABLE IF EXISTS pre_authorizations CASCADE;

CREATE TABLE pre_authorizations (
    id BIGSERIAL PRIMARY KEY,
    pre_auth_number VARCHAR(100) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    provider_name VARCHAR(200),
    
    -- Medical Information
    diagnosis_code VARCHAR(20) NOT NULL,
    diagnosis_description VARCHAR(500),
    procedure_codes VARCHAR(2000),
    procedure_descriptions VARCHAR(2000),
    service_type VARCHAR(20) NOT NULL,
    
    -- Cost Information
    estimated_cost DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    
    -- Doctor Information
    doctor_name VARCHAR(200),
    doctor_specialty VARCHAR(100),
    
    -- Request Information
    request_date DATE NOT NULL,
    expected_service_date DATE NOT NULL,
    service_from_date DATE,
    service_to_date DATE,
    number_of_days INTEGER,
    
    -- Status and Approval
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    reviewer_id BIGINT,
    reviewed_at TIMESTAMP,
    approval_expiry_date DATE,
    
    -- Notes and Attachments
    request_notes VARCHAR(3000),
    reviewer_notes VARCHAR(3000),
    rejection_reason VARCHAR(2000),
    attachments VARCHAR(2000),
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_preauth_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_preauth_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id),
    CONSTRAINT uk_pre_auth_number UNIQUE (pre_auth_number)
);

CREATE INDEX idx_preauth_member ON pre_authorizations(member_id);
CREATE INDEX idx_preauth_status ON pre_authorizations(status);
CREATE INDEX idx_preauth_provider ON pre_authorizations(provider_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V052
-- ═══════════════════════════════════════════════════════════════════════════
