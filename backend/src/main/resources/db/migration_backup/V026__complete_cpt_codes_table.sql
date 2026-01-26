-- ═══════════════════════════════════════════════════════════════════════════
-- V026: Complete cpt_codes Table for CptCode Entity
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Recreate cpt_codes with all columns from Entity
-- Fixes: Schema-validation: missing column [co_payment_percentage] in table [cpt_codes]
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop and recreate with full structure
DROP TABLE IF EXISTS cpt_codes CASCADE;

CREATE TABLE cpt_codes (
    id BIGSERIAL PRIMARY KEY,
    
    -- Code identification
    code VARCHAR(20) NOT NULL UNIQUE,
    description_ar VARCHAR(500) NOT NULL,
    description_en VARCHAR(500) NOT NULL,
    
    -- Categorization  
    category VARCHAR(100),
    sub_category VARCHAR(100),
    procedure_type VARCHAR(20),
    
    -- Pricing
    standard_price DECIMAL(15,2),
    max_allowed_price DECIMAL(15,2),
    min_allowed_price DECIMAL(15,2),
    
    -- Coverage
    covered BOOLEAN NOT NULL DEFAULT TRUE,
    co_payment_percentage DECIMAL(5,2),
    
    -- Pre-auth requirement
    requires_pre_auth BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Additional info
    notes VARCHAR(2000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_cpt_code UNIQUE (code)
);

-- Indexes
CREATE INDEX idx_cpt_codes_code ON cpt_codes(code);
CREATE INDEX idx_cpt_codes_category ON cpt_codes(category);
CREATE INDEX idx_cpt_codes_active ON cpt_codes(active);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V026
-- ═══════════════════════════════════════════════════════════════════════════
