-- =============================================================================
-- V005: SUPPORTING TABLES
-- =============================================================================
-- Created: 2025-12-28
-- Purpose: Import logs, module access, feature flags, and administrative tables
-- Safe: Uses IF NOT EXISTS / IF EXISTS checks
-- =============================================================================

-- =============================================================================
-- 1. MEMBER_IMPORT_LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS member_import_logs (
    id BIGSERIAL PRIMARY KEY,
    import_batch_id VARCHAR(64) NOT NULL UNIQUE,
    file_name VARCHAR(500),
    file_size_bytes BIGINT,
    
    -- Statistics
    total_rows INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, VALIDATING, PROCESSING, COMPLETED, PARTIAL, FAILED
    error_message TEXT,
    
    -- Processing timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time_ms BIGINT,
    
    -- Security context
    imported_by_user_id BIGINT,
    imported_by_username VARCHAR(100),
    company_scope_id BIGINT,
    ip_address VARCHAR(45),
    
    created_at TIMESTAMP
);

COMMENT ON TABLE member_import_logs IS 'Audit log for bulk member import operations';

-- =============================================================================
-- 2. MEMBER_IMPORT_ERRORS
-- =============================================================================
CREATE TABLE IF NOT EXISTS member_import_errors (
    id BIGSERIAL PRIMARY KEY,
    import_log_id BIGINT NOT NULL,
    row_number INTEGER,
    field_name VARCHAR(100),
    field_value TEXT,
    error_type VARCHAR(50),                    -- VALIDATION, DUPLICATE, MISSING_REQUIRED, INVALID_FORMAT
    error_message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE member_import_errors IS 'Detailed errors from member import operations';

-- =============================================================================
-- 3. MODULE_ACCESS
-- =============================================================================
CREATE TABLE IF NOT EXISTS module_access (
    id BIGSERIAL PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    module_key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    allowed_roles TEXT NOT NULL,               -- JSON array: ["SUPER_ADMIN", "ADMIN", "EMPLOYER"]
    required_permissions TEXT,                 -- JSON array: ["VIEW_MEMBERS", "MANAGE_MEMBERS"]
    feature_flag_key VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE module_access IS 'Module-level access control (which roles can access which modules)';
COMMENT ON COLUMN module_access.allowed_roles IS 'JSON array of role names that can access this module';

-- =============================================================================
-- 4. FEATURE_FLAGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGSERIAL PRIMARY KEY,
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    flag_name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    role_filters TEXT,                         -- JSON array: ["EMPLOYER", "ADMIN"] (if null, applies to all)
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE feature_flags IS 'Feature flags for dynamic feature toggling';
COMMENT ON COLUMN feature_flags.role_filters IS 'JSON array of roles this flag applies to (null = all roles)';

-- =============================================================================
-- VALIDATION
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'module_access') THEN
        RAISE EXCEPTION 'module_access table missing - migration failed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'feature_flags') THEN
        RAISE EXCEPTION 'feature_flags table missing - migration failed';
    END IF;
END $$;
