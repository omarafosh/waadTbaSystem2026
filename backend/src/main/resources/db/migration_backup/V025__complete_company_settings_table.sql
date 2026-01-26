-- ═══════════════════════════════════════════════════════════════════════════
-- V025: Complete company_settings Table for CompanySettings Entity
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Recreate company_settings with all columns from Entity
-- Fixes: Schema-validation: missing column [can_download_attachments] in table [company_settings]
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the simple table from V020 and recreate with full structure
DROP TABLE IF EXISTS company_settings CASCADE;

CREATE TABLE company_settings (
    id BIGSERIAL PRIMARY KEY,
    
    -- Company and employer references
    company_id BIGINT NOT NULL,
    employer_id BIGINT NOT NULL,
    
    -- Feature flags
    can_view_claims BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_visits BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit_members BOOLEAN NOT NULL DEFAULT TRUE,
    can_download_attachments BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- UI configuration (JSON)
    ui_visibility JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint for company + employer combination
    CONSTRAINT uk_company_employer_settings UNIQUE (company_id, employer_id),
    
    -- Foreign keys
    CONSTRAINT fk_cs_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_cs_employer FOREIGN KEY (employer_id) REFERENCES employers(id)
);

-- Indexes
CREATE INDEX idx_company_settings_employer ON company_settings(employer_id);
CREATE INDEX idx_company_settings_company ON company_settings(company_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V025
-- ═══════════════════════════════════════════════════════════════════════════
