-- ═══════════════════════════════════════════════════════════════════════════
-- V044: Create Password Reset Token Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS password_reset_token (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(255) NOT NULL,
    expiry_time TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_token(email);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V044
-- ═══════════════════════════════════════════════════════════════════════════
