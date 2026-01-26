-- =============================================================================
-- V006: INDEXES AND CONSTRAINTS
-- =============================================================================
-- Created: 2025-12-28
-- Purpose: All foreign keys, indexes, and unique constraints
-- Safe: Uses IF NOT EXISTS checks
-- =============================================================================

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- RBAC Constraints
ALTER TABLE role_permissions 
    DROP CONSTRAINT IF EXISTS fk_role_permissions_role,
    ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE role_permissions 
    DROP CONSTRAINT IF EXISTS fk_role_permissions_permission,
    ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

ALTER TABLE user_roles 
    DROP CONSTRAINT IF EXISTS fk_user_roles_user,
    ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_roles 
    DROP CONSTRAINT IF EXISTS fk_user_roles_role,
    ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE password_reset_tokens 
    DROP CONSTRAINT IF EXISTS fk_password_reset_user,
    ADD CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Member Constraints
ALTER TABLE members 
    DROP CONSTRAINT IF EXISTS fk_members_employer_org,
    ADD CONSTRAINT fk_members_employer_org FOREIGN KEY (employer_org_id) REFERENCES organizations(id);

ALTER TABLE members 
    DROP CONSTRAINT IF EXISTS fk_members_insurance_org,
    ADD CONSTRAINT fk_members_insurance_org FOREIGN KEY (insurance_org_id) REFERENCES organizations(id);

ALTER TABLE members 
    DROP CONSTRAINT IF EXISTS fk_members_benefit_policy,
    ADD CONSTRAINT fk_members_benefit_policy FOREIGN KEY (benefit_policy_id) REFERENCES benefit_policies(id);

ALTER TABLE family_members 
    DROP CONSTRAINT IF EXISTS fk_family_members_member,
    ADD CONSTRAINT fk_family_members_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE member_attributes 
    DROP CONSTRAINT IF EXISTS fk_member_attributes_member,
    ADD CONSTRAINT fk_member_attributes_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- Chronic Conditions Constraints
ALTER TABLE member_chronic_conditions 
    DROP CONSTRAINT IF EXISTS fk_mcc_member,
    ADD CONSTRAINT fk_mcc_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE member_chronic_conditions 
    DROP CONSTRAINT IF EXISTS fk_mcc_chronic_condition,
    ADD CONSTRAINT fk_mcc_chronic_condition FOREIGN KEY (chronic_condition_id) REFERENCES chronic_conditions(id);

-- Provider Constraints
ALTER TABLE provider_contracts 
    DROP CONSTRAINT IF EXISTS fk_provider_contracts_provider,
    ADD CONSTRAINT fk_provider_contracts_provider FOREIGN KEY (provider_id) REFERENCES providers(id);

-- Medical Services Constraints
ALTER TABLE medical_services 
    DROP CONSTRAINT IF EXISTS fk_medical_services_category,
    ADD CONSTRAINT fk_medical_services_category FOREIGN KEY (category_id) REFERENCES medical_categories(id);

ALTER TABLE medical_package_services 
    DROP CONSTRAINT IF EXISTS fk_mps_package,
    ADD CONSTRAINT fk_mps_package FOREIGN KEY (package_id) REFERENCES medical_packages(id) ON DELETE CASCADE;

ALTER TABLE medical_package_services 
    DROP CONSTRAINT IF EXISTS fk_mps_service,
    ADD CONSTRAINT fk_mps_service FOREIGN KEY (service_id) REFERENCES medical_services(id) ON DELETE CASCADE;

ALTER TABLE provider_contract_pricing_items 
    DROP CONSTRAINT IF EXISTS fk_pcpi_contract,
    ADD CONSTRAINT fk_pcpi_contract FOREIGN KEY (contract_id) REFERENCES provider_contracts(id) ON DELETE CASCADE;

ALTER TABLE provider_contract_pricing_items 
    DROP CONSTRAINT IF EXISTS fk_pcpi_service,
    ADD CONSTRAINT fk_pcpi_service FOREIGN KEY (medical_service_id) REFERENCES medical_services(id);

ALTER TABLE provider_contract_pricing_items 
    DROP CONSTRAINT IF EXISTS fk_pcpi_category,
    ADD CONSTRAINT fk_pcpi_category FOREIGN KEY (medical_category_id) REFERENCES medical_categories(id);

-- Benefit Policy Constraints
ALTER TABLE benefit_policies 
    DROP CONSTRAINT IF EXISTS fk_bp_employer_org,
    ADD CONSTRAINT fk_bp_employer_org FOREIGN KEY (employer_org_id) REFERENCES organizations(id);

ALTER TABLE benefit_policies 
    DROP CONSTRAINT IF EXISTS fk_bp_insurance_org,
    ADD CONSTRAINT fk_bp_insurance_org FOREIGN KEY (insurance_org_id) REFERENCES organizations(id);

ALTER TABLE benefit_policy_rules 
    DROP CONSTRAINT IF EXISTS fk_bpr_policy,
    ADD CONSTRAINT fk_bpr_policy FOREIGN KEY (benefit_policy_id) REFERENCES benefit_policies(id) ON DELETE CASCADE;

ALTER TABLE benefit_policy_rules 
    DROP CONSTRAINT IF EXISTS fk_bpr_category,
    ADD CONSTRAINT fk_bpr_category FOREIGN KEY (medical_category_id) REFERENCES medical_categories(id);

ALTER TABLE benefit_policy_rules 
    DROP CONSTRAINT IF EXISTS fk_bpr_service,
    ADD CONSTRAINT fk_bpr_service FOREIGN KEY (medical_service_id) REFERENCES medical_services(id);

-- Claims Constraints
ALTER TABLE claims 
    DROP CONSTRAINT IF EXISTS fk_claims_member,
    ADD CONSTRAINT fk_claims_member FOREIGN KEY (member_id) REFERENCES members(id);

ALTER TABLE claims 
    DROP CONSTRAINT IF EXISTS fk_claims_insurance_org,
    ADD CONSTRAINT fk_claims_insurance_org FOREIGN KEY (insurance_org_id) REFERENCES organizations(id);

ALTER TABLE claims 
    DROP CONSTRAINT IF EXISTS fk_claims_pre_approval,
    ADD CONSTRAINT fk_claims_pre_approval FOREIGN KEY (pre_approval_id) REFERENCES pre_approvals(id);

ALTER TABLE claim_lines 
    DROP CONSTRAINT IF EXISTS fk_claim_lines_claim,
    ADD CONSTRAINT fk_claim_lines_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE;

ALTER TABLE claim_attachments 
    DROP CONSTRAINT IF EXISTS fk_claim_attachments_claim,
    ADD CONSTRAINT fk_claim_attachments_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE;

ALTER TABLE claim_audit_logs 
    DROP CONSTRAINT IF EXISTS fk_cal_claim,
    ADD CONSTRAINT fk_cal_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE;

-- Pre-Approval Constraints
ALTER TABLE pre_approvals 
    DROP CONSTRAINT IF EXISTS fk_pa_member,
    ADD CONSTRAINT fk_pa_member FOREIGN KEY (member_id) REFERENCES members(id);

ALTER TABLE pre_approvals 
    DROP CONSTRAINT IF EXISTS fk_pa_visit,
    ADD CONSTRAINT fk_pa_visit FOREIGN KEY (visit_id) REFERENCES visits(id);

ALTER TABLE pre_approvals 
    DROP CONSTRAINT IF EXISTS fk_pa_mcc,
    ADD CONSTRAINT fk_pa_mcc FOREIGN KEY (member_chronic_condition_id) REFERENCES member_chronic_conditions(id);

ALTER TABLE pre_approval_rules 
    DROP CONSTRAINT IF EXISTS fk_par_chronic_condition,
    ADD CONSTRAINT fk_par_chronic_condition FOREIGN KEY (chronic_condition_id) REFERENCES chronic_conditions(id);

ALTER TABLE pre_authorizations 
    DROP CONSTRAINT IF EXISTS fk_preauth_member,
    ADD CONSTRAINT fk_preauth_member FOREIGN KEY (member_id) REFERENCES members(id);

-- Visit Constraints
ALTER TABLE visits 
    DROP CONSTRAINT IF EXISTS fk_visits_member,
    ADD CONSTRAINT fk_visits_member FOREIGN KEY (member_id) REFERENCES members(id);

-- Eligibility Constraints
ALTER TABLE eligibility_checks 
    DROP CONSTRAINT IF EXISTS fk_ec_member,
    ADD CONSTRAINT fk_ec_member FOREIGN KEY (member_id) REFERENCES members(id);

-- Import Constraints
ALTER TABLE member_import_errors 
    DROP CONSTRAINT IF EXISTS fk_mie_import_log,
    ADD CONSTRAINT fk_mie_import_log FOREIGN KEY (import_log_id) REFERENCES member_import_logs(id) ON DELETE CASCADE;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Member Indexes
CREATE INDEX IF NOT EXISTS idx_members_employer_org ON members(employer_org_id);
CREATE INDEX IF NOT EXISTS idx_members_insurance_org ON members(insurance_org_id);
CREATE INDEX IF NOT EXISTS idx_members_benefit_policy ON members(benefit_policy_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_card_status ON members(card_status);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(active);

-- Family Members Indexes
CREATE INDEX IF NOT EXISTS idx_family_members_member ON family_members(member_id);
CREATE INDEX IF NOT EXISTS idx_family_members_status ON family_members(status);

-- Provider Indexes
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(active);

-- Provider Contract Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_provider ON provider_contracts(provider_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON provider_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON provider_contracts(start_date, end_date);

-- Benefit Policy Indexes
CREATE INDEX IF NOT EXISTS idx_bp_employer_org ON benefit_policies(employer_org_id);
CREATE INDEX IF NOT EXISTS idx_bp_status ON benefit_policies(status);
CREATE INDEX IF NOT EXISTS idx_bp_dates ON benefit_policies(start_date, end_date);

-- Benefit Policy Rules Indexes
CREATE INDEX IF NOT EXISTS idx_bpr_policy ON benefit_policy_rules(benefit_policy_id);
CREATE INDEX IF NOT EXISTS idx_bpr_category ON benefit_policy_rules(medical_category_id);
CREATE INDEX IF NOT EXISTS idx_bpr_service ON benefit_policy_rules(medical_service_id);
CREATE INDEX IF NOT EXISTS idx_bpr_active ON benefit_policy_rules(active);

-- Claims Indexes
CREATE INDEX IF NOT EXISTS idx_claims_member ON claims(member_id);
CREATE INDEX IF NOT EXISTS idx_claims_insurance_org ON claims(insurance_org_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_visit_date ON claims(visit_date);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);

-- Claim Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_cal_claim ON claim_audit_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_cal_timestamp ON claim_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_cal_actor ON claim_audit_logs(actor_user_id);

-- Pre-Approval Indexes
CREATE INDEX IF NOT EXISTS idx_pa_member ON pre_approvals(member_id);
CREATE INDEX IF NOT EXISTS idx_pa_status ON pre_approvals(status);
CREATE INDEX IF NOT EXISTS idx_pa_request_date ON pre_approvals(request_date);
CREATE INDEX IF NOT EXISTS idx_pa_type ON pre_approvals(type);

-- Pre-Authorization Indexes
CREATE INDEX IF NOT EXISTS idx_preauth_member ON pre_authorizations(member_id);
CREATE INDEX IF NOT EXISTS idx_preauth_status ON pre_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_preauth_request_date ON pre_authorizations(request_date);

-- Visit Indexes
CREATE INDEX IF NOT EXISTS idx_visits_member ON visits(member_id);
CREATE INDEX IF NOT EXISTS idx_visits_provider ON visits(provider_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_type ON visits(visit_type);

-- Eligibility Check Indexes
-- NOTE: Indexes for eligibility_checks are defined in V004 migration to match EligibilityCheck.java entity

-- Medical Services Indexes
CREATE INDEX IF NOT EXISTS idx_ms_category ON medical_services(category_id);
CREATE INDEX IF NOT EXISTS idx_ms_code ON medical_services(code);

-- ICD/CPT Code Indexes
CREATE INDEX IF NOT EXISTS idx_icd_code ON icd_codes(code);
CREATE INDEX IF NOT EXISTS idx_icd_active ON icd_codes(active);
CREATE INDEX IF NOT EXISTS idx_cpt_code ON cpt_codes(code);
CREATE INDEX IF NOT EXISTS idx_cpt_active ON cpt_codes(active);
CREATE INDEX IF NOT EXISTS idx_cpt_category ON cpt_codes(category);

-- =============================================================================
-- VALIDATION
-- =============================================================================
DO $$
DECLARE
    constraint_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check that critical FK constraints exist
    SELECT COUNT(*) INTO constraint_count 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN ('members', 'claims', 'benefit_policies', 'claim_lines');
    
    IF constraint_count < 5 THEN
        RAISE WARNING 'Expected more FK constraints. Found: %', constraint_count;
    END IF;
    
    -- Check that critical indexes exist
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename IN ('members', 'claims', 'pre_approvals') 
    AND schemaname = 'public';
    
    IF index_count < 5 THEN
        RAISE WARNING 'Expected more indexes. Found: %', index_count;
    END IF;
    
    RAISE NOTICE 'Constraints: %, Indexes: %', constraint_count, index_count;
END $$;
