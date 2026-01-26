-- ═══════════════════════════════════════════════════════════════════════════
-- V008: Provider Contracts Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create provider contracts and pricing agreements
-- Dependencies: V003 (benefit_policies), V007 (providers)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- CONTRACT STATUS ENUM
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE contract_status AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'ACTIVE',
    'SUSPENDED',
    'EXPIRED',
    'TERMINATED'
);

-- ───────────────────────────────────────────────────────────────────────────
-- PROVIDER CONTRACTS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE provider_contracts (
    id BIGSERIAL PRIMARY KEY,
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    provider_id BIGINT NOT NULL,
    benefit_policy_id BIGINT,
    
    -- Contract details
    contract_name VARCHAR(255),
    status contract_status DEFAULT 'DRAFT',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Financial terms
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    payment_terms_days INTEGER DEFAULT 30,
    credit_limit DECIMAL(15,2),
    
    -- Pricing model
    pricing_model VARCHAR(50) DEFAULT 'DISCOUNT',  -- DISCOUNT, FIXED, CAPITATION
    pricing_config JSONB DEFAULT '{}',
    
    -- Network
    network_tier VARCHAR(20),
    is_preferred BOOLEAN DEFAULT FALSE,
    
    -- Services covered
    covered_services JSONB DEFAULT '[]',
    excluded_services JSONB DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    signed_date DATE,
    signed_by VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_pc_provider FOREIGN KEY (provider_id) 
        REFERENCES providers(id),
    CONSTRAINT fk_pc_benefit_policy FOREIGN KEY (benefit_policy_id) 
        REFERENCES benefit_policies(id),
    CONSTRAINT chk_pc_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_pc_contract_number ON provider_contracts(contract_number);
CREATE INDEX idx_pc_provider ON provider_contracts(provider_id);
CREATE INDEX idx_pc_benefit_policy ON provider_contracts(benefit_policy_id);
CREATE INDEX idx_pc_status ON provider_contracts(status);
CREATE INDEX idx_pc_dates ON provider_contracts(start_date, end_date);
CREATE INDEX idx_pc_active ON provider_contracts(active);

-- ───────────────────────────────────────────────────────────────────────────
-- PROVIDER CONTRACT PRICING TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE provider_contract_pricing (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(255),
    category VARCHAR(100),
    
    -- Pricing
    list_price DECIMAL(15,2),
    contracted_price DECIMAL(15,2),
    discount_percentage DECIMAL(5,2),
    
    -- Limits
    max_quantity INTEGER,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Validity
    effective_date DATE,
    expiry_date DATE,
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pcp_contract FOREIGN KEY (contract_id) 
        REFERENCES provider_contracts(id) ON DELETE CASCADE,
    CONSTRAINT uk_pcp_contract_service UNIQUE (contract_id, service_code)
);

CREATE INDEX idx_pcp_contract ON provider_contract_pricing(contract_id);
CREATE INDEX idx_pcp_service ON provider_contract_pricing(service_code);
CREATE INDEX idx_pcp_category ON provider_contract_pricing(category);
CREATE INDEX idx_pcp_active ON provider_contract_pricing(active);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V008
-- ═══════════════════════════════════════════════════════════════════════════
