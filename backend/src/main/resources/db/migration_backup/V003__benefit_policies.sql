-- ═══════════════════════════════════════════════════════════════════════════
-- V003: Benefit Policies Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create benefit_policies table (ONLY policy model)
-- Dependencies: V001 (organizations), V002 (employers)
-- CRITICAL: This is the ONLY policy model in the system. No legacy Policy.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- BENEFIT POLICY STATUS ENUM
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE benefit_policy_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'EXPIRED',
    'SUSPENDED',
    'CANCELLED'
);

-- ───────────────────────────────────────────────────────────────────────────
-- BENEFIT POLICIES TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE benefit_policies (
    id BIGSERIAL PRIMARY KEY,
    policy_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    status benefit_policy_status DEFAULT 'DRAFT',
    
    -- Employer linkage (main business axis)
    employer_organization_id BIGINT NOT NULL,
    
    -- Coverage period
    effective_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- Financial limits
    annual_limit DECIMAL(15,2),
    individual_limit DECIMAL(15,2),
    family_limit DECIMAL(15,2),
    deductible DECIMAL(15,2) DEFAULT 0,
    copay_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Waiting periods (days)
    waiting_period_days INTEGER DEFAULT 0,
    pre_existing_waiting_days INTEGER DEFAULT 365,
    
    -- Coverage settings
    network_type VARCHAR(50),
    coverage_type VARCHAR(50),
    tier_level VARCHAR(20),
    
    -- Rules configuration (JSON for flexibility)
    coverage_rules JSONB DEFAULT '{}',
    exclusions JSONB DEFAULT '[]',
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_bp_employer_org FOREIGN KEY (employer_organization_id) 
        REFERENCES organizations(id),
    CONSTRAINT chk_bp_dates CHECK (expiration_date > effective_date),
    CONSTRAINT chk_bp_copay CHECK (copay_percentage >= 0 AND copay_percentage <= 100)
);

CREATE INDEX idx_benefit_policies_code ON benefit_policies(policy_code);
CREATE INDEX idx_benefit_policies_status ON benefit_policies(status);
CREATE INDEX idx_benefit_policies_employer_org ON benefit_policies(employer_organization_id);
CREATE INDEX idx_benefit_policies_effective ON benefit_policies(effective_date);
CREATE INDEX idx_benefit_policies_expiration ON benefit_policies(expiration_date);
CREATE INDEX idx_benefit_policies_active ON benefit_policies(active);
CREATE INDEX idx_benefit_policies_tier ON benefit_policies(tier_level);

-- ───────────────────────────────────────────────────────────────────────────
-- BENEFIT POLICY RULES TABLE (Eligibility Rules per Policy)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE benefit_policy_rules (
    id BIGSERIAL PRIMARY KEY,
    benefit_policy_id BIGINT NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_name_ar VARCHAR(100),
    rule_type VARCHAR(50) NOT NULL,  -- COVERAGE, LIMIT, EXCLUSION, WAITING
    config JSONB NOT NULL DEFAULT '{}',
    priority INTEGER DEFAULT 100,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bpr_policy FOREIGN KEY (benefit_policy_id) 
        REFERENCES benefit_policies(id) ON DELETE CASCADE,
    CONSTRAINT uk_bpr_policy_rule UNIQUE (benefit_policy_id, rule_code)
);

CREATE INDEX idx_bpr_policy ON benefit_policy_rules(benefit_policy_id);
CREATE INDEX idx_bpr_rule_code ON benefit_policy_rules(rule_code);
CREATE INDEX idx_bpr_rule_type ON benefit_policy_rules(rule_type);
CREATE INDEX idx_bpr_active ON benefit_policy_rules(active);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V003
-- ═══════════════════════════════════════════════════════════════════════════
