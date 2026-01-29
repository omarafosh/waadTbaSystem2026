-- =============================================================================
-- V101: ENTERPRISE MEDICAL CLASSIFICATION (3-LEVEL)
-- =============================================================================
-- Level 1: Medical Categories (Fixed)
-- Level 2: Medical Specialties
-- Level 3: Medical Services
-- =============================================================================

-- 1. Ensure Level 1 Categories Exist (Locked)
-- Codes: CAT_OP (Outpatient), CAT_IP (Inpatient), CAT_EM (Emergency)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
VALUES 
    ('CAT_OP', 'العيادات الخارجية', 'Outpatient Clinics', NULL, TRUE, NOW(), NOW()),
    ('CAT_IP', 'الإيواء والعمليات الجراحية', 'Inpatient & Surgeries', NULL, TRUE, NOW(), NOW()),
    ('CAT_EM', 'الطوارئ', 'Emergency', NULL, TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE 
SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en, updated_at = NOW();

-- 2. Create Level 2: Medical Specialties
CREATE TABLE IF NOT EXISTS medical_specialties (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE medical_specialties IS 'Level 2: Specializations (Internal Medicine, Pediatrics, etc.)';

-- 3. Update Level 3: Medical Services
-- Add link to Specialty
ALTER TABLE medical_services 
    ADD COLUMN IF NOT EXISTS specialty_id BIGINT REFERENCES medical_specialties(id);

-- 4. Many-to-Many Mapping: Service <-> Category
-- Requirement: Same service can exist in multiple categories with different rules
CREATE TABLE IF NOT EXISTS medical_service_category_mapping (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES medical_services(id),
    category_id BIGINT NOT NULL REFERENCES medical_categories(id),
    notes TEXT,
    UNIQUE (service_id, category_id)
);

COMMENT ON TABLE medical_service_category_mapping IS 'Allows a medical service to be categorized under multiple Level 1 categories';

-- 5. Seeding initial Specialties
INSERT INTO medical_specialties (code, name_ar, name_en)
VALUES 
    ('SPEC_INT', 'الطب الباطني', 'Internal Medicine'),
    ('SPEC_PED', 'طب الأطفال', 'Pediatrics'),
    ('SPEC_ORT', 'جراحة العظام', 'Orthopedics'),
    ('SPEC_RAD', 'الأشعة', 'Radiology'),
    ('SPEC_LAB', 'المختبرات', 'Laboratory')
ON CONFLICT (code) DO NOTHING;
