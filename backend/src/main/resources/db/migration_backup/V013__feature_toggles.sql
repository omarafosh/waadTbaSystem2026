-- ═══════════════════════════════════════════════════════════════════════════
-- V013: Feature Toggles and System Config Tables - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create feature toggles and system configuration tables
-- Dependencies: V001 (organizations), V002 (employers)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- FEATURE TOGGLES TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE feature_toggles (
    id BIGSERIAL PRIMARY KEY,
    feature_code VARCHAR(100) NOT NULL UNIQUE,
    feature_name VARCHAR(255) NOT NULL,
    feature_name_ar VARCHAR(255),
    description TEXT,
    
    -- Toggle state
    enabled BOOLEAN DEFAULT FALSE,
    
    -- Scope (global or per employer)
    scope VARCHAR(50) DEFAULT 'GLOBAL',  -- GLOBAL, EMPLOYER, USER
    
    -- Configuration
    config JSONB DEFAULT '{}',
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_ft_code ON feature_toggles(feature_code);
CREATE INDEX idx_ft_enabled ON feature_toggles(enabled);
CREATE INDEX idx_ft_scope ON feature_toggles(scope);
CREATE INDEX idx_ft_active ON feature_toggles(active);

-- ───────────────────────────────────────────────────────────────────────────
-- EMPLOYER FEATURE TOGGLES TABLE (Per-Employer Overrides)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE employer_feature_toggles (
    id BIGSERIAL PRIMARY KEY,
    employer_id BIGINT NOT NULL,
    feature_toggle_id BIGINT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eft_employer FOREIGN KEY (employer_id) REFERENCES employers(id),
    CONSTRAINT fk_eft_feature FOREIGN KEY (feature_toggle_id) REFERENCES feature_toggles(id),
    CONSTRAINT uk_eft_employer_feature UNIQUE (employer_id, feature_toggle_id)
);

CREATE INDEX idx_eft_employer ON employer_feature_toggles(employer_id);
CREATE INDEX idx_eft_feature ON employer_feature_toggles(feature_toggle_id);
CREATE INDEX idx_eft_enabled ON employer_feature_toggles(enabled);

-- ───────────────────────────────────────────────────────────────────────────
-- SYSTEM CONFIG TABLE (Key-Value Store)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE system_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'STRING',  -- STRING, NUMBER, BOOLEAN, JSON
    description TEXT,
    category VARCHAR(100),
    is_sensitive BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_sc_key ON system_config(config_key);
CREATE INDEX idx_sc_category ON system_config(category);
CREATE INDEX idx_sc_active ON system_config(active);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V013
-- ═══════════════════════════════════════════════════════════════════════════
