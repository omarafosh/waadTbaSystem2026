-- ═══════════════════════════════════════════════════════════════════════════
-- V012: Eligibility Engine Tables - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create eligibility check audit tables
-- Dependencies: V004 (members), V007 (providers)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ELIGIBILITY CHECKS TABLE (Audit Log)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE eligibility_checks (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Input
    member_id BIGINT,
    policy_id BIGINT,  -- References benefit_policies.id
    provider_id BIGINT,
    service_date DATE,
    service_code VARCHAR(50),
    
    -- Result
    eligible BOOLEAN NOT NULL,
    status VARCHAR(50) NOT NULL,
    reasons JSONB DEFAULT '[]',
    
    -- Snapshot at time of check
    member_name VARCHAR(255),
    member_civil_id VARCHAR(20),
    member_status VARCHAR(50),
    policy_number VARCHAR(50),
    policy_status VARCHAR(50),
    policy_start_date DATE,
    policy_end_date DATE,
    employer_id BIGINT,
    employer_name VARCHAR(255),
    
    -- Security context
    checked_by_user_id BIGINT,
    checked_by_username VARCHAR(100),
    company_scope_id BIGINT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    
    -- Metrics
    processing_time_ms INTEGER,
    rules_evaluated INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ec_request ON eligibility_checks(request_id);
CREATE INDEX idx_ec_member ON eligibility_checks(member_id);
CREATE INDEX idx_ec_policy ON eligibility_checks(policy_id);
CREATE INDEX idx_ec_provider ON eligibility_checks(provider_id);
CREATE INDEX idx_ec_eligible ON eligibility_checks(eligible);
CREATE INDEX idx_ec_status ON eligibility_checks(status);
CREATE INDEX idx_ec_timestamp ON eligibility_checks(check_timestamp);
CREATE INDEX idx_ec_checked_by ON eligibility_checks(checked_by_user_id);
CREATE INDEX idx_ec_service_date ON eligibility_checks(service_date);

-- ───────────────────────────────────────────────────────────────────────────
-- ELIGIBILITY RULES CONFIG TABLE (System Rules)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE eligibility_rules_config (
    id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL UNIQUE,
    rule_name VARCHAR(100) NOT NULL,
    rule_name_ar VARCHAR(100),
    description TEXT,
    priority INTEGER DEFAULT 100,
    is_hard_rule BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_erc_code ON eligibility_rules_config(rule_code);
CREATE INDEX idx_erc_priority ON eligibility_rules_config(priority);
CREATE INDEX idx_erc_active ON eligibility_rules_config(active);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V012
-- ═══════════════════════════════════════════════════════════════════════════
