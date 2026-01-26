-- ═══════════════════════════════════════════════════════════════════════════
-- V006: Member Attributes Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create flexible member attributes (EAV pattern) and import logs
-- Dependencies: V004 (members)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ATTRIBUTE SOURCE ENUM
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE attribute_source AS ENUM (
    'EXCEL_IMPORT',
    'MANUAL_ENTRY',
    'API_SYNC',
    'ODOO_IMPORT',
    'SYSTEM'
);

-- ───────────────────────────────────────────────────────────────────────────
-- MEMBER ATTRIBUTES TABLE (EAV Pattern)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE member_attributes (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    attribute_code VARCHAR(100) NOT NULL,
    attribute_name VARCHAR(255),
    attribute_value TEXT,
    attribute_type VARCHAR(50) DEFAULT 'STRING',
    source attribute_source DEFAULT 'MANUAL_ENTRY',
    source_reference VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ma_member FOREIGN KEY (member_id) 
        REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT uk_ma_member_code UNIQUE (member_id, attribute_code)
);

CREATE INDEX idx_ma_member ON member_attributes(member_id);
CREATE INDEX idx_ma_code ON member_attributes(attribute_code);
CREATE INDEX idx_ma_source ON member_attributes(source);
CREATE INDEX idx_ma_active ON member_attributes(active);

-- ───────────────────────────────────────────────────────────────────────────
-- IMPORT STATUS ENUM
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE import_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'PARTIAL'
);

-- ───────────────────────────────────────────────────────────────────────────
-- MEMBER IMPORT LOGS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE member_import_logs (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_hash VARCHAR(64),
    status import_status DEFAULT 'PENDING',
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    skip_count INTEGER DEFAULT 0,
    error_summary TEXT,
    column_mapping JSONB DEFAULT '{}',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    imported_by_user_id BIGINT,
    imported_by_username VARCHAR(100),
    employer_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mil_status ON member_import_logs(status);
CREATE INDEX idx_mil_file ON member_import_logs(file_name);
CREATE INDEX idx_mil_user ON member_import_logs(imported_by_user_id);
CREATE INDEX idx_mil_employer ON member_import_logs(employer_id);
CREATE INDEX idx_mil_created ON member_import_logs(created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- MEMBER IMPORT ERRORS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE member_import_errors (
    id BIGSERIAL PRIMARY KEY,
    import_log_id BIGINT NOT NULL,
    row_number INTEGER,
    field_name VARCHAR(100),
    error_code VARCHAR(50),
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mie_log FOREIGN KEY (import_log_id) 
        REFERENCES member_import_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_mie_log ON member_import_errors(import_log_id);
CREATE INDEX idx_mie_row ON member_import_errors(row_number);
CREATE INDEX idx_mie_error_code ON member_import_errors(error_code);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V006
-- ═══════════════════════════════════════════════════════════════════════════
