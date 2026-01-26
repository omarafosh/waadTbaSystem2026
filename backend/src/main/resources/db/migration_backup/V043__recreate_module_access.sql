-- ═══════════════════════════════════════════════════════════════════════════
-- V043: Recreate Module Access Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- The original table structure doesn't match the Entity
-- Recreating with correct structure
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS module_access CASCADE;

CREATE TABLE module_access (
    id BIGSERIAL PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    module_key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    allowed_roles JSON NOT NULL DEFAULT '[]',
    required_permissions JSON,
    feature_flag_key VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ma_module_key ON module_access(module_key);
CREATE INDEX IF NOT EXISTS idx_ma_active ON module_access(active);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V043
-- ═══════════════════════════════════════════════════════════════════════════
