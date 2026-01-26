-- ═══════════════════════════════════════════════════════════════════════════
-- V009: Medical Categories and Services Tables - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create medical service catalog (categories, packages, services)
-- Dependencies: V001 (core schema)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- MEDICAL CATEGORIES TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE medical_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    parent_id BIGINT,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    color VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_mc_parent FOREIGN KEY (parent_id) REFERENCES medical_categories(id)
);

CREATE INDEX idx_mc_code ON medical_categories(code);
CREATE INDEX idx_mc_parent ON medical_categories(parent_id);
CREATE INDEX idx_mc_active ON medical_categories(active);
CREATE INDEX idx_mc_sort ON medical_categories(sort_order);

-- ───────────────────────────────────────────────────────────────────────────
-- MEDICAL PACKAGES TABLE (Service Bundles)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE medical_packages (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    category_id BIGINT,
    
    -- Pricing
    base_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'KWD',
    
    -- Package details
    validity_days INTEGER,
    max_uses INTEGER,
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_mp_category FOREIGN KEY (category_id) 
        REFERENCES medical_categories(id)
);

CREATE INDEX idx_mp_code ON medical_packages(code);
CREATE INDEX idx_mp_category ON medical_packages(category_id);
CREATE INDEX idx_mp_active ON medical_packages(active);

-- ───────────────────────────────────────────────────────────────────────────
-- MEDICAL SERVICES TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE medical_services (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    cpt_code VARCHAR(20),
    icd_code VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    
    -- Classification
    category_id BIGINT,
    package_id BIGINT,
    service_type VARCHAR(50),
    
    -- Pricing
    base_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'KWD',
    unit_of_measure VARCHAR(50),
    
    -- Limits
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_threshold DECIMAL(15,2),
    max_quantity_per_visit INTEGER,
    max_quantity_per_year INTEGER,
    
    -- Waiting periods
    waiting_period_days INTEGER DEFAULT 0,
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_ms_category FOREIGN KEY (category_id) 
        REFERENCES medical_categories(id),
    CONSTRAINT fk_ms_package FOREIGN KEY (package_id) 
        REFERENCES medical_packages(id)
);

CREATE INDEX idx_ms_code ON medical_services(code);
CREATE INDEX idx_ms_cpt ON medical_services(cpt_code);
CREATE INDEX idx_ms_icd ON medical_services(icd_code);
CREATE INDEX idx_ms_category ON medical_services(category_id);
CREATE INDEX idx_ms_package ON medical_services(package_id);
CREATE INDEX idx_ms_type ON medical_services(service_type);
CREATE INDEX idx_ms_active ON medical_services(active);
CREATE INDEX idx_ms_approval ON medical_services(requires_approval);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V009
-- ═══════════════════════════════════════════════════════════════════════════
