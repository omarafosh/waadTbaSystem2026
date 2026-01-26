-- ═══════════════════════════════════════════════════════════════════════════
-- V007: Providers Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create providers table (healthcare providers/hospitals)
-- Dependencies: V001 (organizations)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- PROVIDER ENUMS
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE provider_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING'
);

CREATE TYPE provider_type AS ENUM (
    'HOSPITAL',
    'CLINIC',
    'PHARMACY',
    'LAB',
    'IMAGING',
    'DENTAL',
    'OPTICAL',
    'OTHER'
);

-- ───────────────────────────────────────────────────────────────────────────
-- PROVIDERS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE providers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_arabic VARCHAR(255) NOT NULL,
    name_english VARCHAR(255),
    provider_type provider_type NOT NULL,
    status provider_status DEFAULT 'ACTIVE',
    
    -- Organization linkage
    organization_id BIGINT,
    
    -- Contact information
    phone VARCHAR(30),
    fax VARCHAR(30),
    email VARCHAR(100),
    website VARCHAR(255),
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    governorate VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Kuwait',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Licensing
    license_number VARCHAR(50),
    license_expiry DATE,
    moh_id VARCHAR(50),
    
    -- Network classification
    network_tier VARCHAR(20),
    is_in_network BOOLEAN DEFAULT TRUE,
    
    -- Operational
    working_hours JSONB DEFAULT '{}',
    specialties JSONB DEFAULT '[]',
    services JSONB DEFAULT '[]',
    
    -- Financial
    discount_rate DECIMAL(5,2) DEFAULT 0,
    payment_terms VARCHAR(100),
    
    -- Metadata
    notes TEXT,
    logo_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_providers_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id)
);

CREATE INDEX idx_providers_code ON providers(code);
CREATE INDEX idx_providers_name_ar ON providers(name_arabic);
CREATE INDEX idx_providers_type ON providers(provider_type);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_city ON providers(city);
CREATE INDEX idx_providers_network ON providers(is_in_network);
CREATE INDEX idx_providers_organization ON providers(organization_id);
CREATE INDEX idx_providers_active ON providers(active);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V007
-- ═══════════════════════════════════════════════════════════════════════════
