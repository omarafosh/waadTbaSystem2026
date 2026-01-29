-- ═══════════════════════════════════════════════════════════════════════════
-- V1.04: Providers and Contracts
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. PROVIDERS
CREATE TABLE providers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    provider_type VARCHAR(20) NOT NULL, -- HOSPITAL, CLINIC, LAB, PHARMACY
    
    -- Contact & Address
    phone VARCHAR(50),
    email VARCHAR(100),
    city VARCHAR(100),
    address VARCHAR(500),
    tax_number VARCHAR(50),
    
    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,
    network_status VARCHAR(20), -- IN_NETWORK, OUT_OF_NETWORK, PREFERRED
    
    -- Contract Summary (Denormalized/Cache)
    contract_start_date DATE,
    contract_end_date DATE,
    default_discount_rate DECIMAL(5, 2),
    
    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_providers_type ON providers(provider_type);
CREATE INDEX idx_providers_license ON providers(license_number);

-- 2. PROVIDER CONTRACTS
CREATE TABLE provider_contracts (
    id BIGSERIAL PRIMARY KEY,
    contract_code VARCHAR(50) NOT NULL UNIQUE,
    contract_number VARCHAR(100),
    
    provider_id BIGINT NOT NULL,
    employer_id BIGINT, -- Optional link to specific employer (if not standard network)
    
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    pricing_model VARCHAR(20) NOT NULL DEFAULT 'DISCOUNT',
    
    -- Terms
    start_date DATE NOT NULL,
    end_date DATE,
    signed_date DATE,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_terms VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'LYD',
    
    -- Pricing (Global)
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    discount_rate DECIMAL(5, 2), -- Deprecated but kept for backup
    total_value DECIMAL(15, 2),  -- Deprecated
    
    -- Contact
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    notes VARCHAR(2000),
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_contracts_provider FOREIGN KEY (provider_id) REFERENCES providers(id),
    CONSTRAINT fk_contracts_employer FOREIGN KEY (employer_id) REFERENCES organizations(id)
);

CREATE INDEX idx_contracts_provider ON provider_contracts(provider_id);
CREATE INDEX idx_contracts_status ON provider_contracts(status);

-- 3. PROVIDER CONTRACT PRICING ITEMS
CREATE TABLE provider_contract_pricing_items (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    
    -- Target (Category or Service)
    medical_category_id BIGINT,
    medical_service_id BIGINT,
    
    -- Pricing (Precedence over contract global discount)
    pricing_type VARCHAR(20) NOT NULL, -- DISCOUNT, FIXED_PRICE
    discount_percent DECIMAL(5, 2),
    fixed_price DECIMAL(15, 2),
    
    -- Context (OPD, IPD, ER)
    visit_type VARCHAR(20), 
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_pcpi_contract FOREIGN KEY (contract_id) REFERENCES provider_contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_pcpi_category FOREIGN KEY (medical_category_id) REFERENCES medical_categories(id),
    CONSTRAINT fk_pcpi_service FOREIGN KEY (medical_service_id) REFERENCES medical_services(id),
    
    -- prevent duplicates
    CONSTRAINT uk_pcpi_target UNIQUE (contract_id, medical_category_id, medical_service_id, visit_type)
);
