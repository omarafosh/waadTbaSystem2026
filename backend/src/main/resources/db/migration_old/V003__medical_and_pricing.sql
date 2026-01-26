-- =============================================================================
-- V003: MEDICAL SERVICES & PRICING
-- =============================================================================
-- Created: 2025-12-28
-- Purpose: Medical categories, services, packages, and medical codes
-- Safe: Uses IF NOT EXISTS / IF EXISTS checks
-- =============================================================================

-- =============================================================================
-- 1. MEDICAL_CATEGORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS medical_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

COMMENT ON TABLE medical_categories IS 'Medical service categories (Lab Tests, Radiology, Dental, Surgery, etc.)';
COMMENT ON COLUMN medical_categories.code IS 'Unique code: LAB, RAD, DENT, SURG, EMER, OP, IP, CONS, PATH, PROC';

-- =============================================================================
-- 2. MEDICAL_SERVICES
-- =============================================================================
CREATE TABLE IF NOT EXISTS medical_services (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category VARCHAR(255),                     -- DEPRECATED: Legacy text field
    category_id BIGINT,                        -- CANONICAL: FK to medical_categories
    price_lyd DOUBLE PRECISION NOT NULL,
    cost_lyd DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

COMMENT ON TABLE medical_services IS 'Medical services/procedures catalog';
COMMENT ON COLUMN medical_services.category IS 'DEPRECATED: Use category_id instead. Kept for backward compatibility.';
COMMENT ON COLUMN medical_services.category_id IS 'CANONICAL: Foreign key to medical_categories table';

-- =============================================================================
-- 3. MEDICAL_PACKAGES (Service bundles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS medical_packages (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    description TEXT,
    package_type VARCHAR(50),                  -- MATERNITY, SURGERY, CHRONIC_CARE, ANNUAL_CHECKUP
    total_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

COMMENT ON TABLE medical_packages IS 'Bundled medical service packages';

-- =============================================================================
-- 4. MEDICAL_PACKAGE_SERVICES (Many-to-Many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS medical_package_services (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    sequence_order INTEGER,
    notes VARCHAR(500),
    UNIQUE (package_id, service_id)
);

COMMENT ON TABLE medical_package_services IS 'Services included in medical packages';

-- =============================================================================
-- 5. PROVIDER_CONTRACT_PRICING_ITEMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS provider_contract_pricing_items (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    medical_service_id BIGINT NOT NULL,
    medical_category_id BIGINT,                -- Optional category override
    base_price DECIMAL(15, 2) NOT NULL,
    contract_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'service',
    currency VARCHAR(3) DEFAULT 'LYD',
    effective_from DATE,
    effective_to DATE,
    notes VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE (contract_id, medical_service_id)
);

COMMENT ON TABLE provider_contract_pricing_items IS 'Per-service pricing within provider contracts';

-- =============================================================================
-- 6. ICD_CODES (International Classification of Diseases)
-- =============================================================================
CREATE TABLE IF NOT EXISTS icd_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description_ar VARCHAR(500) NOT NULL,
    description_en VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    sub_category VARCHAR(100),
    version VARCHAR(20),                       -- ICD_10, ICD_11
    notes VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE icd_codes IS 'ICD diagnosis codes (ICD-10/ICD-11)';

-- =============================================================================
-- 7. CPT_CODES (Current Procedural Terminology)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cpt_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description_ar VARCHAR(500) NOT NULL,
    description_en VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    procedure_type VARCHAR(20),                -- CONSULTATION, DIAGNOSTIC, THERAPEUTIC, SURGICAL, etc.
    
    -- Pricing information
    standard_price DECIMAL(15, 2),
    max_allowed_price DECIMAL(15, 2),
    min_allowed_price DECIMAL(15, 2),
    
    -- Coverage information
    covered BOOLEAN NOT NULL DEFAULT TRUE,
    co_payment_percentage DECIMAL(15, 2),
    requires_pre_auth BOOLEAN NOT NULL DEFAULT FALSE,
    
    notes VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE cpt_codes IS 'CPT procedure codes with pricing and coverage info';
COMMENT ON COLUMN cpt_codes.procedure_type IS 'CONSULTATION, DIAGNOSTIC, THERAPEUTIC, SURGICAL, LABORATORY, RADIOLOGY, etc.';

-- =============================================================================
-- VALIDATION
-- =============================================================================
DO $$
BEGIN
    -- Validate medical_services has category_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_services' 
                   AND column_name = 'category_id') THEN
        RAISE EXCEPTION 'medical_services.category_id column missing - migration failed';
    END IF;
    
    -- Validate medical_categories exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'medical_categories') THEN
        RAISE EXCEPTION 'medical_categories table missing - migration failed';
    END IF;
END $$;
