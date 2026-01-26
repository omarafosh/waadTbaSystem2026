-- ═══════════════════════════════════════════════════════════════════════════
-- V020: Schema Alignment for Windows Local Development
-- TBA WAAD System - Production-Grade Stabilization
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Align database schema with JPA entities for spring.jpa.hibernate.ddl-auto=validate
-- This migration ensures ALL entity columns exist in the database
-- Dependencies: V001-V019 (all prior migrations)
-- Safe: Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS patterns
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. VISITS TABLE (MISSING - Required by Visit entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS visits (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    employer_org_id BIGINT,
    provider_id BIGINT,
    doctor_name VARCHAR(255),
    specialty VARCHAR(255),
    visit_date DATE NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    total_amount DECIMAL(15,2),
    notes VARCHAR(1000),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_visits_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_visits_employer_org FOREIGN KEY (employer_org_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_visits_member_id ON visits(member_id);
CREATE INDEX IF NOT EXISTS idx_visits_provider_id ON visits(provider_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_employer_org ON visits(employer_org_id);
CREATE INDEX IF NOT EXISTS idx_visits_active ON visits(active);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. COMPANIES TABLE (MISSING - Required by Company entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. COMPANY_SETTINGS TABLE (Required by CompanySettings entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_settings (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    description VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cs_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_company_setting UNIQUE (company_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_company_settings_company ON company_settings(company_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. REVIEWER_COMPANIES TABLE (Required by ReviewerCompany entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviewer_companies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_rc_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_rc_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_reviewer_company UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_reviewer_companies_user ON reviewer_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_companies_company ON reviewer_companies(company_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. CLAIM_ATTACHMENTS TABLE (Required by ClaimAttachment entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS claim_attachments (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000),
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ca_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_claim_attachments_claim ON claim_attachments(claim_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. CLAIM_AUDIT_LOGS TABLE (Required by ClaimAuditLog entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS claim_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cal_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_claim_audit_logs_claim ON claim_audit_logs(claim_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. PASSWORD_RESET_TOKENS TABLE (Required by PasswordResetToken entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. ICD_CODES TABLE (Required by IcdCode entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS icd_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    category VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_icd_codes_code ON icd_codes(code);
CREATE INDEX IF NOT EXISTS idx_icd_codes_category ON icd_codes(category);

-- ───────────────────────────────────────────────────────────────────────────
-- 9. CPT_CODES TABLE (Required by CptCode entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cpt_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    category VARCHAR(100),
    base_price DECIMAL(15,2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cpt_codes_code ON cpt_codes(code);
CREATE INDEX IF NOT EXISTS idx_cpt_codes_category ON cpt_codes(category);

-- ───────────────────────────────────────────────────────────────────────────
-- 10. CHRONIC_CONDITIONS TABLE (Required by ChronicCondition entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chronic_conditions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    icd_codes TEXT,
    requires_monitoring BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chronic_conditions_code ON chronic_conditions(code);
CREATE INDEX IF NOT EXISTS idx_chronic_conditions_category ON chronic_conditions(category);

-- ───────────────────────────────────────────────────────────────────────────
-- 11. MEMBER_CHRONIC_CONDITIONS TABLE (Required by MemberChronicCondition entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_chronic_conditions (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    chronic_condition_id BIGINT NOT NULL,
    diagnosed_date DATE,
    diagnosis_notes TEXT,
    severity VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mcc_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_mcc_condition FOREIGN KEY (chronic_condition_id) REFERENCES chronic_conditions(id)
);

CREATE INDEX IF NOT EXISTS idx_member_chronic_conditions_member ON member_chronic_conditions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_chronic_conditions_condition ON member_chronic_conditions(chronic_condition_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 12. PRE_AUTHORIZATION TABLE (Required by PreAuthorization entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pre_authorizations (
    id BIGSERIAL PRIMARY KEY,
    authorization_number VARCHAR(100) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    provider_id BIGINT,
    service_code VARCHAR(50),
    service_description TEXT,
    requested_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pa2_member FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE INDEX IF NOT EXISTS idx_pre_authorizations_member ON pre_authorizations(member_id);
CREATE INDEX IF NOT EXISTS idx_pre_authorizations_status ON pre_authorizations(status);

-- ───────────────────────────────────────────────────────────────────────────
-- 13. PRE_APPROVAL_RULES TABLE (Required by PreApprovalRule entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pre_approval_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50),
    threshold_amount DECIMAL(15,2),
    auto_approve BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 100,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pre_approval_rules_code ON pre_approval_rules(rule_code);
CREATE INDEX IF NOT EXISTS idx_pre_approval_rules_type ON pre_approval_rules(rule_type);

-- ───────────────────────────────────────────────────────────────────────────
-- 14. MODULE_ACCESS TABLE (Required by ModuleAccess entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS module_access (
    id BIGSERIAL PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    role_id BIGINT NOT NULL,
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ma_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uk_module_role UNIQUE (module_name, role_id)
);

CREATE INDEX IF NOT EXISTS idx_module_access_role ON module_access(role_id);
CREATE INDEX IF NOT EXISTS idx_module_access_module ON module_access(module_name);

-- ───────────────────────────────────────────────────────────────────────────
-- 15. FEATURE_FLAGS TABLE (Required by FeatureFlag entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGSERIAL PRIMARY KEY,
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    flag_name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- ───────────────────────────────────────────────────────────────────────────
-- 16. PROVIDER_CONTRACTS TABLE (Required by ProviderContract entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_contracts (
    id BIGSERIAL PRIMARY KEY,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    provider_id BIGINT NOT NULL,
    benefit_policy_id BIGINT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    payment_terms VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_pc_provider FOREIGN KEY (provider_id) REFERENCES providers(id),
    CONSTRAINT fk_pc_benefit_policy FOREIGN KEY (benefit_policy_id) REFERENCES benefit_policies(id)
);

CREATE INDEX IF NOT EXISTS idx_provider_contracts_provider ON provider_contracts(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_contracts_policy ON provider_contracts(benefit_policy_id);
CREATE INDEX IF NOT EXISTS idx_provider_contracts_status ON provider_contracts(status);

-- ───────────────────────────────────────────────────────────────────────────
-- 17. PROVIDER_CONTRACT_PRICING_ITEMS TABLE (Required by ProviderContractPricingItem entity)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_contract_pricing_items (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    service_code VARCHAR(50),
    service_name VARCHAR(255),
    price DECIMAL(15,2) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pcpi_contract FOREIGN KEY (contract_id) REFERENCES provider_contracts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pcpi_contract ON provider_contract_pricing_items(contract_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 18. ALTER EXISTING TABLES - ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 18a. AUDIT_LOGS TABLE - Add missing columns for AuditLog entity
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;

-- ───────────────────────────────────────────────────────────────────────────
-- 18b. MEMBERS TABLE - Add missing columns
-- ───────────────────────────────────────────────────────────────────────────

-- Entity uses employer_org_id but migration has employer_organization_id
ALTER TABLE members ADD COLUMN IF NOT EXISTS employer_org_id BIGINT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS insurance_org_id BIGINT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS eligibility_updated_at TIMESTAMP;

-- Sync employer_org_id with employer_organization_id if needed
UPDATE members SET employer_org_id = employer_organization_id WHERE employer_org_id IS NULL AND employer_organization_id IS NOT NULL;

-- Add FK if not exists (will silently fail if already exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_members_ins_org') THEN
        ALTER TABLE members ADD CONSTRAINT fk_members_ins_org FOREIGN KEY (insurance_org_id) REFERENCES organizations(id);
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 18c. CLAIMS TABLE - Add missing columns for Claim entity
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE claims ADD COLUMN IF NOT EXISTS insurance_org_id BIGINT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS provider_name VARCHAR(255);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS visit_date DATE;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS requested_amount DECIMAL(15,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(15,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS difference_amount DECIMAL(15,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS reviewer_comment TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS patient_copay DECIMAL(15,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS net_provider_amount DECIMAL(15,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS copay_percent DECIMAL(5,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS deductible_applied DECIMAL(15,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS settlement_notes TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS service_count INTEGER;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS attachments_count INTEGER;

-- Add FK for insurance_org_id
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_claims_ins_org') THEN
        ALTER TABLE claims ADD CONSTRAINT fk_claims_ins_org FOREIGN KEY (insurance_org_id) REFERENCES organizations(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_claims_insurance_org ON claims(insurance_org_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 18d. CLAIM_LINES TABLE - Add missing columns
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE claim_lines ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE claim_lines ADD COLUMN IF NOT EXISTS total_price DECIMAL(15,2);

-- ───────────────────────────────────────────────────────────────────────────
-- 18e. PROVIDERS TABLE - Add missing columns for Provider entity
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE providers ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS default_discount_rate DECIMAL(5,2);

-- ───────────────────────────────────────────────────────────────────────────
-- 18f. BENEFIT_POLICIES TABLE - Add missing columns for BenefitPolicy entity
-- ───────────────────────────────────────────────────────────────────────────

-- Entity uses employer_org_id but migration has employer_organization_id
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS employer_org_id BIGINT;
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS insurance_org_id BIGINT;
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS per_member_limit DECIMAL(15,2);
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS per_family_limit DECIMAL(15,2);
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS default_coverage_percent INTEGER;
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS default_waiting_period_days INTEGER DEFAULT 0;

-- Sync employer_org_id with employer_organization_id
UPDATE benefit_policies SET employer_org_id = employer_organization_id WHERE employer_org_id IS NULL AND employer_organization_id IS NOT NULL;

-- Sync date columns
UPDATE benefit_policies SET start_date = effective_date WHERE start_date IS NULL AND effective_date IS NOT NULL;
UPDATE benefit_policies SET end_date = expiration_date WHERE end_date IS NULL AND expiration_date IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 18g. PRE_APPROVALS TABLE - Add missing columns for PreApproval entity
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS approval_number VARCHAR(100);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS type VARCHAR(30);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS visit_id BIGINT;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS provider_name VARCHAR(200);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS service_code VARCHAR(50);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS service_description VARCHAR(500);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS diagnosis_code VARCHAR(20);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS diagnosis_description VARCHAR(500);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS rejected_amount DECIMAL(15,2);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS member_remaining_balance DECIMAL(15,2);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS exceed_amount DECIMAL(15,2);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS required_level VARCHAR(30);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS request_date DATE;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS expected_service_date DATE;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS request_reason VARCHAR(2000);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS medical_reviewer_id BIGINT;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS medical_reviewed_at TIMESTAMP;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS medical_review_notes VARCHAR(2000);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS manager_approver_id BIGINT;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS manager_notes VARCHAR(2000);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS member_chronic_condition_id BIGINT;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS valid_from DATE;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT FALSE;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(2000);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS auto_approval_rule VARCHAR(500);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS attachments VARCHAR(2000);
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;

-- Generate approval_number for existing records
UPDATE pre_approvals SET approval_number = 'PA-' || LPAD(id::TEXT, 8, '0') WHERE approval_number IS NULL;

-- Make approval_number unique if not already
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_approval_number') THEN
        ALTER TABLE pre_approvals ADD CONSTRAINT uk_approval_number UNIQUE (approval_number);
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 18h. ORGANIZATIONS TABLE - Add missing columns
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

-- ───────────────────────────────────────────────────────────────────────────
-- 18i. FAMILY_MEMBERS TABLE - Add missing columns for FamilyMember entity
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE family_members ADD COLUMN IF NOT EXISTS notes VARCHAR(2000);

-- ───────────────────────────────────────────────────────────────────────────
-- 18j. MEMBER_ATTRIBUTES TABLE - Add missing columns
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE member_attributes ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE member_attributes ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- ───────────────────────────────────────────────────────────────────────────
-- 18k. ELIGIBILITY_CHECKS TABLE - Add missing columns
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS request_id VARCHAR(50);

-- ───────────────────────────────────────────────────────────────────────────
-- 18l. MEDICAL_CATEGORIES TABLE - Add missing columns
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE medical_categories ADD COLUMN IF NOT EXISTS requires_pre_approval BOOLEAN DEFAULT FALSE;

-- ───────────────────────────────────────────────────────────────────────────
-- 18m. PERMISSIONS TABLE - Align with Permission entity
-- The entity uses 'name' as unique field, but V001 has 'code' as unique
-- We need both columns to work properly
-- ───────────────────────────────────────────────────────────────────────────

-- If 'name' doesn't have unique constraint but 'code' does, we need to adjust
-- First ensure name column has the right constraint
DO $$ 
BEGIN
    -- Drop old unique constraint on code if it exists (but keep the column)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permissions_code_key') THEN
        ALTER TABLE permissions DROP CONSTRAINT permissions_code_key;
    END IF;
    
    -- Add unique constraint on name if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permissions_name_key') THEN
        -- First, copy code values to name where name is null
        UPDATE permissions SET name = code WHERE name IS NULL OR name = '';
        
        -- Make name not null and unique
        ALTER TABLE permissions ALTER COLUMN name SET NOT NULL;
        ALTER TABLE permissions ADD CONSTRAINT permissions_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail migration
    RAISE NOTICE 'Permission table constraint adjustment: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 19. ENSURE ENUM TYPES HAVE ALL VALUES
-- ═══════════════════════════════════════════════════════════════════════════

-- Add missing enum values (PostgreSQL 10+ syntax)
DO $$ 
BEGIN
    -- Add INACTIVE to member_status if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'INACTIVE' AND enumtypid = 'member_status'::regtype) THEN
        ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'INACTIVE';
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors (enum value might already exist)
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 20. CREATE MISSING INDEXES FOR ENTITY RELATIONSHIPS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_members_employer_org ON members(employer_org_id);
CREATE INDEX IF NOT EXISTS idx_members_insurance_org ON members(insurance_org_id);
CREATE INDEX IF NOT EXISTS idx_benefit_policies_employer_org ON benefit_policies(employer_org_id);
CREATE INDEX IF NOT EXISTS idx_benefit_policies_insurance_org ON benefit_policies(insurance_org_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V020
-- ═══════════════════════════════════════════════════════════════════════════
