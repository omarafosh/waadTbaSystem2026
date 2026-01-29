-- ═══════════════════════════════════════════════════════════════════════════
-- V1.05: Benefit Policies
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. BENEFIT POLICIES
CREATE TABLE benefit_policies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    policy_code VARCHAR(50),
    description VARCHAR(2000),
    
    -- Organization Links
    employer_org_id BIGINT NOT NULL,
    insurance_org_id BIGINT,
    
    -- Dates & Status
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, EXPIRED, SUSPENDED
    
    -- Limits (Global)
    annual_limit DECIMAL(15, 2) NOT NULL,
    default_coverage_percent INTEGER NOT NULL DEFAULT 80,
    per_member_limit DECIMAL(15, 2),
    per_family_limit DECIMAL(15, 2),
    default_waiting_period_days INTEGER DEFAULT 0,
    
    covered_members_count INTEGER DEFAULT 0,
    notes VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_policy_employer FOREIGN KEY (employer_org_id) REFERENCES organizations(id),
    CONSTRAINT fk_policy_insurance FOREIGN KEY (insurance_org_id) REFERENCES organizations(id)
);

CREATE INDEX idx_policy_employer ON benefit_policies(employer_org_id);
CREATE INDEX idx_policy_dates ON benefit_policies(start_date, end_date);

-- 2. BENEFIT POLICY RULES (Coverage details)
CREATE TABLE benefit_policy_rules (
    id BIGSERIAL PRIMARY KEY,
    benefit_policy_id BIGINT NOT NULL,
    
    -- Target (Category or Service)
    medical_category_id BIGINT,
    medical_service_id BIGINT,
    
    -- Coverage Settings
    coverage_percent INTEGER, -- Inherits if null
    amount_limit DECIMAL(15, 2),
    times_limit INTEGER,
    waiting_period_days INTEGER DEFAULT 0,
    requires_pre_approval BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Context
    encounter_type VARCHAR(30), -- OPD, ER, IPD
    
    notes VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_bpr_policy FOREIGN KEY (benefit_policy_id) REFERENCES benefit_policies(id) ON DELETE CASCADE,
    CONSTRAINT fk_bpr_category FOREIGN KEY (medical_category_id) REFERENCES medical_categories(id),
    CONSTRAINT fk_bpr_service FOREIGN KEY (medical_service_id) REFERENCES medical_services(id),
    
    -- logical constraints
    CONSTRAINT uk_bpr_policy_category_context UNIQUE (benefit_policy_id, medical_category_id, encounter_type),
    CONSTRAINT uk_bpr_policy_service_context UNIQUE (benefit_policy_id, medical_service_id, encounter_type)
);

CREATE INDEX idx_bpr_policy ON benefit_policy_rules(benefit_policy_id);
