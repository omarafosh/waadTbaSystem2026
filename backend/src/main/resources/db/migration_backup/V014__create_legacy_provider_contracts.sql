-- =====================================================
-- V014: Create missing tables
-- Date: 2026-01-01
-- Purpose: Support legacy ProviderContract entity,
--          create missing pre_authorization_audit table,
--          and create provider_services junction table
-- =====================================================

-- =====================================================
-- 1. Create legacy_provider_contracts table
-- =====================================================

CREATE TABLE IF NOT EXISTS legacy_provider_contracts (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    contract_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'LYD',
    effective_from DATE NOT NULL,
    effective_to DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_legacy_provider_contract_service_date 
        UNIQUE (provider_id, service_code, effective_from)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_legacy_provider_contracts_provider 
    ON legacy_provider_contracts(provider_id);

CREATE INDEX IF NOT EXISTS idx_legacy_provider_contracts_service 
    ON legacy_provider_contracts(service_code);

CREATE INDEX IF NOT EXISTS idx_legacy_provider_contracts_dates 
    ON legacy_provider_contracts(effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_legacy_provider_contracts_active 
    ON legacy_provider_contracts(active);

-- Add comments
COMMENT ON TABLE legacy_provider_contracts IS 'Legacy provider contracts - flat pricing per service per provider';

-- =====================================================
-- 2. Create pre_authorization_audit table
-- =====================================================

CREATE TABLE IF NOT EXISTS pre_authorization_audit (
    id BIGSERIAL PRIMARY KEY,
    pre_authorization_id BIGINT NOT NULL,
    reference_number VARCHAR(50),
    changed_by VARCHAR(100) NOT NULL,
    change_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(20) NOT NULL,
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    notes VARCHAR(500),
    ip_address VARCHAR(45)
);

-- Create indexes for pre_authorization_audit
CREATE INDEX IF NOT EXISTS idx_audit_preauth 
    ON pre_authorization_audit(pre_authorization_id);

CREATE INDEX IF NOT EXISTS idx_audit_user 
    ON pre_authorization_audit(changed_by);

CREATE INDEX IF NOT EXISTS idx_audit_date 
    ON pre_authorization_audit(change_date);

CREATE INDEX IF NOT EXISTS idx_audit_action 
    ON pre_authorization_audit(action);

-- Add FK constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_preauth_audit_preauth') THEN
        ALTER TABLE pre_authorization_audit DROP CONSTRAINT fk_preauth_audit_preauth;
    END IF;
END $$;

ALTER TABLE pre_authorization_audit
    ADD CONSTRAINT fk_preauth_audit_preauth 
        FOREIGN KEY (pre_authorization_id) 
        REFERENCES pre_authorizations(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE pre_authorization_audit IS 'Audit trail for pre-authorization changes';
COMMENT ON COLUMN pre_authorization_audit.action IS 'CREATE, UPDATE, APPROVE, REJECT, CANCEL, DELETE, STATUS_CHANGE';

-- =====================================================
-- 3. Create provider_services junction table
-- =====================================================

CREATE TABLE IF NOT EXISTS provider_services (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_provider_service UNIQUE (provider_id, service_code)
);

-- Create indexes for provider_services
CREATE INDEX IF NOT EXISTS idx_provider_services_provider 
    ON provider_services(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_services_code 
    ON provider_services(service_code);

CREATE INDEX IF NOT EXISTS idx_provider_services_active 
    ON provider_services(active);

-- Add FK constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_provider_services_provider') THEN
        ALTER TABLE provider_services DROP CONSTRAINT fk_provider_services_provider;
    END IF;
END $$;

ALTER TABLE provider_services
    ADD CONSTRAINT fk_provider_services_provider 
        FOREIGN KEY (provider_id) 
        REFERENCES providers(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE provider_services IS 'Junction table linking providers to services they offer';
COMMENT ON COLUMN provider_services.service_code IS 'References MedicalService.code (loose coupling)';

-- =====================================================
-- END V014
-- =====================================================
