-- ═══════════════════════════════════════════════════════════════════════════
-- V002: Employers Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create employers table (main business axis)
-- Dependencies: V001 (organizations)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- EMPLOYER STATUS ENUM
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE employer_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING'
);

-- ───────────────────────────────────────────────────────────────────────────
-- EMPLOYERS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE employers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    status employer_status DEFAULT 'ACTIVE',
    organization_id BIGINT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(30),
    contact_email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Kuwait',
    registration_number VARCHAR(50),
    commercial_registration VARCHAR(50),
    tax_number VARCHAR(50),
    sector VARCHAR(100),
    employee_count INTEGER DEFAULT 0,
    contract_start_date DATE,
    contract_end_date DATE,
    notes TEXT,
    logo_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_employers_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_employers_code ON employers(code);
CREATE INDEX idx_employers_name_ar ON employers(name_ar);
CREATE INDEX idx_employers_status ON employers(status);
CREATE INDEX idx_employers_organization ON employers(organization_id);
CREATE INDEX idx_employers_active ON employers(active);
CREATE INDEX idx_employers_sector ON employers(sector);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V002
-- ═══════════════════════════════════════════════════════════════════════════
