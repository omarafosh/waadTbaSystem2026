-- ═══════════════════════════════════════════════════════════════════════════
-- V1.03: Medical Taxonomy
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. MEDICAL CATEGORIES
CREATE TABLE medical_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL, -- Unified name field (was name_ar)
    parent_id BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES medical_categories(id)
);

CREATE INDEX idx_categories_parent ON medical_categories(parent_id);

-- 2. MEDICAL SERVICES
CREATE TABLE medical_services (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL, -- Unified name field (was name_ar)
    category_id BIGINT,
    
    description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DRAFT, ARCHIVED
    
    -- Legacy/Reference fields (Deprecated but kept for now if Entity requires them)
    base_price DECIMAL(10, 2),
    requires_pa BOOLEAN DEFAULT TRUE,
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES medical_categories(id)
);

CREATE INDEX idx_services_category ON medical_services(category_id);
CREATE INDEX idx_services_name ON medical_services(name);

-- 3. MEDICAL PACKAGES
CREATE TABLE medical_packages (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    total_price DECIMAL(15, 2), -- Optional override price
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 4. MEDICAL PACKAGE ITEMS (Services inside a package)
CREATE TABLE medical_package_items (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15, 2), -- Price within this package
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_mpi_package FOREIGN KEY (package_id) REFERENCES medical_packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_mpi_service FOREIGN KEY (service_id) REFERENCES medical_services(id)
);
