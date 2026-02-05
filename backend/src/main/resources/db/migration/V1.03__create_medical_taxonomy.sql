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
-- 5. SEED DATA
-- Main Categories
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, NULL, true, NOW(), NOW()
FROM (VALUES
    ('MC001', 'الإيواء والعلاج'),
    ('MC002', 'الدواء والمستلزمات الطبية'),
    ('MC003', 'العناية الفائقة وعناية القلب'),
    ('MC004', 'رسوم الأطباء والجراحيين'),
    ('MC005', 'الكشوفات التشخيصية'),
    ('MC006', 'العلاج والرعاية اليومية'),
    ('MC101', 'طب الأسنان'),
    ('MC102', 'طب العيون'),
    ('MC103', 'المختبر والأشعة'),
    ('MC104', 'الطوارئ والزيارات')
) AS main_cat(code, name)
ON CONFLICT (code) DO NOTHING;

-- Sub-Categories (Sample)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC001'), true, NOW(), NOW()
FROM (VALUES
    ('SC001001', 'خدمات الإيواء'),
    ('SC001002', 'الخدمات بأقسام الإيواء والطوارئ'),
    ('SC001003', 'الإقامة')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- طب الأسنان (MC101) Subcategories
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC101'), true, NOW(), NOW()
FROM (VALUES
    ('SC101001', 'كشف وصورة'),
    ('SC101002', 'العلاج التحفظي (الحشو)'),
    ('SC101003', 'حشو العصب')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;
