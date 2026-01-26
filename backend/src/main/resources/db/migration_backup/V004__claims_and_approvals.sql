-- =============================================================================
-- V004: CLAIMS, APPROVALS & BENEFIT POLICIES
-- =============================================================================
-- Created: 2025-12-28
-- Purpose: Benefit policies, claims processing, pre-approvals, pre-authorizations
-- Safe: Uses IF NOT EXISTS / IF EXISTS checks
-- =============================================================================

-- =============================================================================
-- 1. BENEFIT_POLICIES (Coverage plans for employers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS benefit_policies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    policy_code VARCHAR(50),
    description VARCHAR(2000),
    employer_org_id BIGINT NOT NULL,           -- Organization (type=EMPLOYER)
    insurance_org_id BIGINT,                   -- Organization (type=INSURANCE/TPA)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    annual_limit DECIMAL(15, 2) NOT NULL,
    default_coverage_percent INTEGER NOT NULL DEFAULT 80,
    per_member_limit DECIMAL(15, 2),
    per_family_limit DECIMAL(15, 2),
    default_waiting_period_days INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, EXPIRED, SUSPENDED
    covered_members_count INTEGER DEFAULT 0,
    notes VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

COMMENT ON TABLE benefit_policies IS 'Benefit policies defining coverage rules for employers';
COMMENT ON COLUMN benefit_policies.status IS 'DRAFT, ACTIVE, EXPIRED, SUSPENDED';
COMMENT ON COLUMN benefit_policies.default_coverage_percent IS 'Default coverage percentage (e.g., 80 means 80% covered)';

-- =============================================================================
-- 2. BENEFIT_POLICY_RULES (Coverage rules per service/category)
-- =============================================================================
CREATE TABLE IF NOT EXISTS benefit_policy_rules (
    id BIGSERIAL PRIMARY KEY,
    benefit_policy_id BIGINT NOT NULL,
    medical_category_id BIGINT,                -- Either category OR service (not both)
    medical_service_id BIGINT,
    coverage_percent INTEGER,                  -- If null, inherits from policy default
    amount_limit DECIMAL(15, 2),
    times_limit INTEGER,
    waiting_period_days INTEGER DEFAULT 0,
    requires_pre_approval BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    UNIQUE (benefit_policy_id, medical_category_id),
    UNIQUE (benefit_policy_id, medical_service_id)
);

COMMENT ON TABLE benefit_policy_rules IS 'Coverage rules for specific services or categories within a policy';
COMMENT ON COLUMN benefit_policy_rules.medical_category_id IS 'Rule applies to entire category (mutually exclusive with medical_service_id)';
COMMENT ON COLUMN benefit_policy_rules.medical_service_id IS 'Rule applies to specific service (mutually exclusive with medical_category_id)';

-- =============================================================================
-- 3. CLAIMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS claims (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    insurance_org_id BIGINT NOT NULL,          -- Organization (type=TPA/INSURANCE)
    pre_approval_id BIGINT,
    
    -- Provider information
    provider_name VARCHAR(255),
    doctor_name VARCHAR(255),
    diagnosis TEXT,
    visit_date DATE,
    
    -- Financial information
    requested_amount DECIMAL(15, 2) NOT NULL,
    approved_amount DECIMAL(15, 2),
    difference_amount DECIMAL(15, 2),
    
    -- Financial snapshot (Phase MVP)
    patient_copay DECIMAL(15, 2),
    net_provider_amount DECIMAL(15, 2),
    copay_percent DECIMAL(5, 2),
    deductible_applied DECIMAL(15, 2),
    
    -- Settlement fields (Phase MVP)
    payment_reference VARCHAR(100),
    settled_at TIMESTAMP,
    settlement_notes TEXT,
    
    -- Status and review
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED
    reviewer_comment TEXT,
    reviewed_at TIMESTAMP,
    
    -- Counts (auto-calculated)
    service_count INTEGER,
    attachments_count INTEGER,
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

COMMENT ON TABLE claims IS 'Medical claims submitted for reimbursement';
COMMENT ON COLUMN claims.status IS 'DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, PARTIALLY_APPROVED, REJECTED, SETTLED';

-- =============================================================================
-- 4. CLAIM_LINES (Services within a claim)
-- =============================================================================
CREATE TABLE IF NOT EXISTS claim_lines (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    service_code VARCHAR(50),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL
);

COMMENT ON TABLE claim_lines IS 'Individual services/procedures within a claim';

-- =============================================================================
-- 5. CLAIM_ATTACHMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS claim_attachments (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000),
    file_type VARCHAR(100),
    created_at TIMESTAMP NOT NULL
);

COMMENT ON TABLE claim_attachments IS 'Supporting documents attached to claims';

-- =============================================================================
-- 6. CLAIM_AUDIT_LOGS (Immutable claim history)
-- =============================================================================
CREATE TABLE IF NOT EXISTS claim_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    change_type VARCHAR(50) NOT NULL,         -- STATUS_CHANGE, AMOUNT_CHANGE, APPROVAL, REJECTION, etc.
    
    -- State changes
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    previous_requested_amount DECIMAL(15, 2),
    new_requested_amount DECIMAL(15, 2),
    previous_approved_amount DECIMAL(15, 2),
    new_approved_amount DECIMAL(15, 2),
    
    -- Actor information
    actor_user_id BIGINT NOT NULL,
    actor_username VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    ip_address VARCHAR(45),
    
    -- Snapshots (JSON)
    before_snapshot TEXT,
    after_snapshot TEXT
);

COMMENT ON TABLE claim_audit_logs IS 'Immutable audit trail for all claim state changes';
COMMENT ON COLUMN claim_audit_logs.change_type IS 'STATUS_CHANGE, AMOUNT_CHANGE, APPROVAL, REJECTION, CREATED, SUBMITTED, etc.';

-- =============================================================================
-- 7. PRE_APPROVALS (All types of pre-approval requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pre_approvals (
    id BIGSERIAL PRIMARY KEY,
    approval_number VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL,                 -- CHRONIC_CONDITION, EXCEED_LIMIT, SPECIAL_VIP, HIGH_COST_SERVICE, etc.
    member_id BIGINT NOT NULL,
    visit_id BIGINT,
    provider_id BIGINT NOT NULL,
    provider_name VARCHAR(200),
    
    -- Service information
    service_code VARCHAR(50),
    service_description VARCHAR(500),
    diagnosis_code VARCHAR(20),
    diagnosis_description VARCHAR(500),
    
    -- Financial information
    requested_amount DECIMAL(15, 2) NOT NULL,
    approved_amount DECIMAL(15, 2),
    rejected_amount DECIMAL(15, 2),
    member_remaining_balance DECIMAL(15, 2),
    exceed_amount DECIMAL(15, 2),
    
    -- Status and workflow
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, UNDER_MEDICAL_REVIEW, APPROVED, REJECTED, EXPIRED, USED, etc.
    required_level VARCHAR(30),                -- AUTO, MEDICAL, MANAGER, DIRECTOR
    
    -- Request information
    request_date DATE NOT NULL,
    expected_service_date DATE,
    request_reason VARCHAR(2000),
    
    -- Review information
    medical_reviewer_id BIGINT,
    medical_reviewed_at TIMESTAMP,
    medical_review_notes VARCHAR(2000),
    
    manager_approver_id BIGINT,
    manager_approved_at TIMESTAMP,
    manager_notes VARCHAR(2000),
    
    -- Chronic condition reference
    member_chronic_condition_id BIGINT,
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    expired BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Rejection
    rejection_reason VARCHAR(2000),
    
    -- Auto approval
    auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
    auto_approval_rule VARCHAR(500),
    
    notes VARCHAR(2000),
    attachments VARCHAR(2000),
    created_by_user_id BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE pre_approvals IS 'Pre-approval requests for services requiring authorization';
COMMENT ON COLUMN pre_approvals.type IS 'CHRONIC_CONDITION, EXCEED_LIMIT, SPECIAL_VIP, HIGH_COST_SERVICE, etc.';
COMMENT ON COLUMN pre_approvals.status IS 'PENDING, UNDER_MEDICAL_REVIEW, APPROVED, REJECTED, EXPIRED, USED, CANCELLED';

-- =============================================================================
-- 8. PRE_APPROVAL_RULES (Rules for when pre-approval is required)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pre_approval_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    service_code VARCHAR(100),                 -- Can use wildcards (e.g., "CPT-123*")
    service_description VARCHAR(500),
    chronic_only BOOLEAN NOT NULL DEFAULT FALSE,
    chronic_condition_id BIGINT,
    provider_type VARCHAR(30),
    min_amount DECIMAL(15, 2),
    max_auto_approve_amount DECIMAL(15, 2),
    requires_manager_review BOOLEAN NOT NULL DEFAULT FALSE,
    required_approval_level VARCHAR(20),       -- AUTO, MEDICAL, MANAGER, DIRECTOR
    priority INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    allow_auto_approval BOOLEAN NOT NULL DEFAULT FALSE,
    auto_approval_conditions VARCHAR(2000),
    validity_days INTEGER DEFAULT 30,
    notes VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE pre_approval_rules IS 'Rules defining when and how pre-approval is required';

-- =============================================================================
-- 9. PRE_AUTHORIZATIONS (Provider pre-auth requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pre_authorizations (
    id BIGSERIAL PRIMARY KEY,
    pre_auth_number VARCHAR(100) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    provider_name VARCHAR(200),
    
    -- Medical information
    diagnosis_code VARCHAR(20) NOT NULL,
    diagnosis_description VARCHAR(500),
    procedure_codes VARCHAR(2000),
    procedure_descriptions VARCHAR(2000),
    service_type VARCHAR(20) NOT NULL,         -- INPATIENT, OUTPATIENT, SURGERY, MATERNITY, etc.
    
    -- Cost information
    estimated_cost DECIMAL(15, 2),
    approved_amount DECIMAL(15, 2),
    
    -- Doctor information
    doctor_name VARCHAR(200),
    doctor_specialty VARCHAR(100),
    
    -- Request information
    request_date DATE NOT NULL,
    expected_service_date DATE NOT NULL,
    service_from_date DATE,
    service_to_date DATE,
    number_of_days INTEGER,
    
    -- Status and approval
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED
    reviewer_id BIGINT,
    reviewed_at TIMESTAMP,
    approval_expiry_date DATE,
    
    -- Notes
    request_notes VARCHAR(3000),
    reviewer_notes VARCHAR(3000),
    rejection_reason VARCHAR(2000),
    attachments VARCHAR(2000),
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE pre_authorizations IS 'Provider-initiated pre-authorization requests';
COMMENT ON COLUMN pre_authorizations.service_type IS 'INPATIENT, OUTPATIENT, SURGERY, MATERNITY, EMERGENCY, DENTAL, OPTICAL, CHRONIC_DISEASE, OTHER';

-- =============================================================================
-- 10. VISITS (Healthcare provider visits)
-- =============================================================================
CREATE TABLE IF NOT EXISTS visits (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    visit_date DATE NOT NULL,
    visit_type VARCHAR(30) NOT NULL,           -- OUTPATIENT, INPATIENT, EMERGENCY, CONSULTATION
    chief_complaint VARCHAR(500),
    diagnosis_code VARCHAR(20),
    diagnosis_description VARCHAR(500),
    doctor_name VARCHAR(200),
    department VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    notes VARCHAR(2000),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE visits IS 'Healthcare provider visits/encounters';

-- =============================================================================
-- 11. ELIGIBILITY_CHECKS (Real-time eligibility verification)
-- =============================================================================
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id BIGSERIAL PRIMARY KEY,
    
    -- Request Identification
    request_id VARCHAR(36) NOT NULL UNIQUE,
    check_timestamp TIMESTAMP NOT NULL,
    
    -- Input Parameters
    member_id BIGINT NOT NULL,
    policy_id BIGINT,
    provider_id BIGINT,
    service_date DATE NOT NULL,
    service_code VARCHAR(50),
    
    -- Result
    eligible BOOLEAN NOT NULL,
    status VARCHAR(50) NOT NULL,
    reasons TEXT,
    
    -- Snapshot (at time of check)
    member_name VARCHAR(255),
    member_civil_id VARCHAR(50),
    member_status VARCHAR(30),
    policy_number VARCHAR(100),
    policy_status VARCHAR(30),
    policy_start_date DATE,
    policy_end_date DATE,
    employer_id BIGINT,
    employer_name VARCHAR(255),
    
    -- Security Context
    checked_by_user_id BIGINT,
    checked_by_username VARCHAR(100),
    company_scope_id BIGINT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    -- Metrics
    processing_time_ms INTEGER,
    rules_evaluated INTEGER,
    
    -- Lifecycle
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE eligibility_checks IS 'Immutable audit log for eligibility verification checks';
COMMENT ON COLUMN eligibility_checks.request_id IS 'Unique request ID (UUID)';
COMMENT ON COLUMN eligibility_checks.check_timestamp IS 'Timestamp when check was performed';
COMMENT ON COLUMN eligibility_checks.service_date IS 'Date of service being checked';
COMMENT ON COLUMN eligibility_checks.eligible IS 'Eligibility determination result';
COMMENT ON COLUMN eligibility_checks.reasons IS 'JSON array of eligibility reasons/failures';

-- Indexes for eligibility_checks
CREATE INDEX IF NOT EXISTS idx_eligibility_request_id 
    ON eligibility_checks(request_id);

CREATE INDEX IF NOT EXISTS idx_eligibility_member_id 
    ON eligibility_checks(member_id);

CREATE INDEX IF NOT EXISTS idx_eligibility_policy_id 
    ON eligibility_checks(policy_id);

CREATE INDEX IF NOT EXISTS idx_eligibility_service_date 
    ON eligibility_checks(service_date);

CREATE INDEX IF NOT EXISTS idx_eligibility_check_timestamp 
    ON eligibility_checks(check_timestamp);

CREATE INDEX IF NOT EXISTS idx_eligibility_company_scope 
    ON eligibility_checks(company_scope_id);

-- =============================================================================
-- VALIDATION
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'claims' 
                   AND column_name = 'insurance_org_id') THEN
        RAISE EXCEPTION 'claims.insurance_org_id column missing - migration failed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'benefit_policies' 
                   AND column_name = 'employer_org_id') THEN
        RAISE EXCEPTION 'benefit_policies.employer_org_id column missing - migration failed';
    END IF;
    
    -- Validate eligibility_checks critical columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eligibility_checks' 
                   AND column_name = 'check_timestamp') THEN
        RAISE EXCEPTION 'eligibility_checks.check_timestamp column missing - migration failed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eligibility_checks' 
                   AND column_name = 'request_id') THEN
        RAISE EXCEPTION 'eligibility_checks.request_id column missing - migration failed';
    END IF;
END $$;
