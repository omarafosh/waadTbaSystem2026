-- ═══════════════════════════════════════════════════════════════════════════
-- V031: Complete Schema Alignment - All Remaining Tables
-- TBA WAAD System - Final Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add ALL missing columns to align with JPA Entities
-- This is a comprehensive fix for all remaining schema mismatches
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. MEDICAL_CATEGORIES - Add name_en column
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE medical_categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);
-- Copy name_ar to name_en if null (temporary fix for existing data)
UPDATE medical_categories SET name_en = name_ar WHERE name_en IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. MEDICAL_SERVICES - Add name_en column
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);
UPDATE medical_services SET name_en = name_ar WHERE name_en IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. COMPANY_SETTINGS - Complete table structure
-- ═══════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS company_settings CASCADE;
CREATE TABLE company_settings (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    employer_id BIGINT NOT NULL,
    can_view_claims BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_visits BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit_members BOOLEAN NOT NULL DEFAULT TRUE,
    can_download_attachments BOOLEAN NOT NULL DEFAULT TRUE,
    ui_visibility JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_company_employer_settings UNIQUE (company_id, employer_id)
);
CREATE INDEX idx_company_settings_employer ON company_settings(employer_id);
CREATE INDEX idx_company_settings_company ON company_settings(company_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. PROVIDERS - Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE providers ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]';

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. MEMBER_IMPORT_LOGS - Create if not exists
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS member_import_logs (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    employer_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_records INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    uploaded_by BIGINT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_member_import_logs_employer ON member_import_logs(employer_id);
CREATE INDEX IF NOT EXISTS idx_member_import_logs_status ON member_import_logs(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. MEMBER_IMPORT_ERRORS - Create if not exists
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS member_import_errors (
    id BIGSERIAL PRIMARY KEY,
    import_log_id BIGINT NOT NULL,
    row_number INTEGER,
    field_name VARCHAR(100),
    error_message TEXT,
    raw_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mie_import_log FOREIGN KEY (import_log_id) REFERENCES member_import_logs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_member_import_errors_log ON member_import_errors(import_log_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. MEDICAL_PACKAGES - Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE medical_packages ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);
UPDATE medical_packages SET name_en = name_ar WHERE name_en IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. PRE_APPROVAL_RULES - Fix table structure
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS medical_category_id BIGINT;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS medical_service_id BIGINT;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS conditions TEXT;
ALTER TABLE pre_approval_rules ADD COLUMN IF NOT EXISTS rule_order INTEGER DEFAULT 100;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. MEMBER_CHRONIC_CONDITIONS - Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE member_chronic_conditions ADD COLUMN IF NOT EXISTS notes TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ROLES - Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE roles ADD COLUMN IF NOT EXISTS system_role BOOLEAN DEFAULT FALSE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 100;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. USERS - Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. CLAIMS - Ensure all columns exist
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE claims ADD COLUMN IF NOT EXISTS employer_org_id BIGINT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Sync employer_org_id from employer_organization_id (the actual column name in V011)
UPDATE claims SET employer_org_id = employer_organization_id WHERE employer_org_id IS NULL AND employer_organization_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. VISITS - Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS icd_code VARCHAR(20);

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. AUDIT_LOGS - Add missing columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id BIGINT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_values TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_values TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 15. BENEFIT_POLICIES - Add status column type check
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS employer_org_id BIGINT;
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);
UPDATE benefit_policies SET employer_org_id = employer_organization_id WHERE employer_org_id IS NULL AND employer_organization_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 16. ORGANIZATIONS - Add type column for polymorphism
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS fax VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V031
-- ═══════════════════════════════════════════════════════════════════════════
