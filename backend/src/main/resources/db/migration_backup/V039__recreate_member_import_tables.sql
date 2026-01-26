-- ═══════════════════════════════════════════════════════════════════════════
-- V039: Complete Member Import Logs Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop and recreate table to match Entity exactly
DROP TABLE IF EXISTS member_import_errors CASCADE;
DROP TABLE IF EXISTS member_import_logs CASCADE;

CREATE TABLE member_import_logs (
    id BIGSERIAL PRIMARY KEY,
    import_batch_id VARCHAR(64) NOT NULL UNIQUE,
    file_name VARCHAR(500),
    file_size_bytes BIGINT,
    total_rows INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time_ms BIGINT,
    imported_by_user_id BIGINT,
    imported_by_username VARCHAR(100),
    company_scope_id BIGINT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mil_batch ON member_import_logs(import_batch_id);
CREATE INDEX idx_mil_status ON member_import_logs(status);
CREATE INDEX idx_mil_company ON member_import_logs(company_scope_id);

-- Recreate member_import_errors with correct structure
CREATE TABLE member_import_errors (
    id BIGSERIAL PRIMARY KEY,
    import_log_id BIGINT NOT NULL,
    row_number INTEGER NOT NULL,
    row_data JSONB,
    error_type VARCHAR(50),
    error_field VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mie_log FOREIGN KEY (import_log_id) REFERENCES member_import_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_mie_log ON member_import_errors(import_log_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V039
-- ═══════════════════════════════════════════════════════════════════════════
