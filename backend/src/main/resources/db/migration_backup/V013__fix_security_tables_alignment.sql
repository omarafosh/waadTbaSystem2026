-- =====================================================
-- Fix Security Tables Schema Alignment
-- Version: V013
-- Date: 2026-01-01
-- Purpose: Align security tables with new schema
-- =====================================================

-- Add security fields to users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'failed_login_count') THEN
        ALTER TABLE users ADD COLUMN failed_login_count INT DEFAULT 0 NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'locked_until') THEN
        ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
    END IF;
END $$;

-- Rename columns in password_reset_tokens to match new schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'password_reset_tokens' AND column_name = 'expiry_date') THEN
        ALTER TABLE password_reset_tokens RENAME COLUMN expiry_date TO expires_at;
    END IF;
END $$;

-- Add missing indexes for password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user_expires ON password_reset_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens(expires_at);

-- Create email verification tokens table if not exists
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_evt_user_expires ON email_verification_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_evt_expires ON email_verification_tokens(expires_at);

-- Create user login attempts table if not exists
CREATE TABLE IF NOT EXISTS user_login_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    success BOOLEAN NOT NULL,
    failed_reason VARCHAR(255),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ula_user_attempted ON user_login_attempts(user_id, attempted_at);
CREATE INDEX IF NOT EXISTS idx_ula_username_attempted ON user_login_attempts(username, attempted_at);
CREATE INDEX IF NOT EXISTS idx_ula_attempted ON user_login_attempts(attempted_at);

-- Create user audit log table if not exists
CREATE TABLE IF NOT EXISTS user_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    performed_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ual_user_action ON user_audit_log(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_ual_action ON user_audit_log(action, created_at);
CREATE INDEX IF NOT EXISTS idx_ual_created ON user_audit_log(created_at);

-- Add security indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add comments
COMMENT ON TABLE password_reset_tokens IS 'Secure tokens for password reset workflow';
COMMENT ON TABLE email_verification_tokens IS 'Tokens for email verification workflow';
COMMENT ON TABLE user_login_attempts IS 'Audit trail of all login attempts';
COMMENT ON TABLE user_audit_log IS 'Comprehensive audit trail for user security events';
