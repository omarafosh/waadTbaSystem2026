-- ═══════════════════════════════════════════════════════════════════════════
-- V010: Pre-Approvals Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create pre-approvals workflow tables
-- Dependencies: V004 (members), V007 (providers), V009 (medical_services)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- PRE-APPROVAL ENUMS
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE pre_approval_status AS ENUM (
    'DRAFT',
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'PARTIALLY_APPROVED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED'
);

CREATE TYPE approval_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);

-- ───────────────────────────────────────────────────────────────────────────
-- PRE-APPROVALS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE pre_approvals (
    id BIGSERIAL PRIMARY KEY,
    approval_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Requestor
    member_id BIGINT NOT NULL,
    provider_id BIGINT,
    
    -- Request details
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    requested_service_date DATE,
    priority approval_priority DEFAULT 'NORMAL',
    
    -- Clinical information
    diagnosis_code VARCHAR(20),
    diagnosis_description TEXT,
    clinical_notes TEXT,
    
    -- Financial
    requested_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'KWD',
    
    -- Status
    status pre_approval_status DEFAULT 'DRAFT',
    rejection_reason TEXT,
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    
    -- Workflow
    submitted_at TIMESTAMP,
    submitted_by_user_id BIGINT,
    reviewed_at TIMESTAMP,
    reviewed_by_user_id BIGINT,
    approved_at TIMESTAMP,
    approved_by_user_id BIGINT,
    
    -- Metadata
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_pa_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_pa_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE INDEX idx_pa_number ON pre_approvals(approval_number);
CREATE INDEX idx_pa_member ON pre_approvals(member_id);
CREATE INDEX idx_pa_provider ON pre_approvals(provider_id);
CREATE INDEX idx_pa_status ON pre_approvals(status);
CREATE INDEX idx_pa_priority ON pre_approvals(priority);
CREATE INDEX idx_pa_request_date ON pre_approvals(request_date);
CREATE INDEX idx_pa_validity ON pre_approvals(valid_from, valid_until);
CREATE INDEX idx_pa_active ON pre_approvals(active);

-- ───────────────────────────────────────────────────────────────────────────
-- PRE-APPROVAL SERVICES TABLE (Line Items)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE pre_approval_services (
    id BIGSERIAL PRIMARY KEY,
    pre_approval_id BIGINT NOT NULL,
    service_id BIGINT,
    service_code VARCHAR(50),
    service_name VARCHAR(255),
    
    -- Quantities
    requested_quantity INTEGER DEFAULT 1,
    approved_quantity INTEGER,
    
    -- Amounts
    unit_price DECIMAL(15,2),
    requested_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pas_preapproval FOREIGN KEY (pre_approval_id) 
        REFERENCES pre_approvals(id) ON DELETE CASCADE,
    CONSTRAINT fk_pas_service FOREIGN KEY (service_id) 
        REFERENCES medical_services(id)
);

CREATE INDEX idx_pas_preapproval ON pre_approval_services(pre_approval_id);
CREATE INDEX idx_pas_service ON pre_approval_services(service_id);
CREATE INDEX idx_pas_status ON pre_approval_services(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V010
-- ═══════════════════════════════════════════════════════════════════════════
