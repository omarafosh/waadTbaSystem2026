-- ═══════════════════════════════════════════════════════════════════════════
-- V014: Audit Log Tables - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create general audit logging tables
-- Dependencies: V001 (users)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- AUDIT LOG TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- What happened
    action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, etc.
    entity_type VARCHAR(100) NOT NULL,  -- Member, Claim, BenefitPolicy, etc.
    entity_id BIGINT,
    entity_name VARCHAR(255),
    
    -- Who did it
    user_id BIGINT,
    username VARCHAR(100),
    user_role VARCHAR(50),
    
    -- Context
    organization_id BIGINT,
    employer_id BIGINT,
    
    -- Details
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    description TEXT,
    
    -- Request info
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    request_id VARCHAR(50),
    session_id VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_al_action ON audit_logs(action);
CREATE INDEX idx_al_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_al_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_al_user ON audit_logs(user_id);
CREATE INDEX idx_al_organization ON audit_logs(organization_id);
CREATE INDEX idx_al_employer ON audit_logs(employer_id);
CREATE INDEX idx_al_created ON audit_logs(created_at);
CREATE INDEX idx_al_request ON audit_logs(request_id);

-- Partition by month for performance (optional - for high-volume systems)
-- CREATE INDEX idx_al_created_month ON audit_logs (date_trunc('month', created_at));

-- ───────────────────────────────────────────────────────────────────────────
-- LOGIN HISTORY TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(100),
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    location_info JSONB,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lh_user ON login_history(user_id);
CREATE INDEX idx_lh_username ON login_history(username);
CREATE INDEX idx_lh_success ON login_history(success);
CREATE INDEX idx_lh_login_at ON login_history(login_at);
CREATE INDEX idx_lh_ip ON login_history(ip_address);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V014
-- ═══════════════════════════════════════════════════════════════════════════
