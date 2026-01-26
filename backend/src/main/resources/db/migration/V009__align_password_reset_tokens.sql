-- =====================================================
-- Align Password Reset Tokens Table
-- Version: V019
-- Date: 2026-01-01
-- Purpose: Add missing columns to support AuthPasswordResetToken entity
-- =====================================================

-- Add email column if not exists (required by AuthPasswordResetToken)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'password_reset_tokens' AND column_name = 'email') THEN
        ALTER TABLE password_reset_tokens ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'password_reset_tokens: Added email column';
    ELSE
        RAISE NOTICE 'password_reset_tokens: email column already exists';
    END IF;
END $$;

-- Add otp column if not exists (required by AuthPasswordResetToken)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'password_reset_tokens' AND column_name = 'otp') THEN
        ALTER TABLE password_reset_tokens ADD COLUMN otp VARCHAR(255);
        RAISE NOTICE 'password_reset_tokens: Added otp column';
    ELSE
        RAISE NOTICE 'password_reset_tokens: otp column already exists';
    END IF;
END $$;

-- Add expiry_time column if not exists (required by AuthPasswordResetToken)
-- Note: This is in addition to expires_at from RbacPasswordResetToken
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'password_reset_tokens' AND column_name = 'expiry_time') THEN
        ALTER TABLE password_reset_tokens ADD COLUMN expiry_time TIMESTAMP;
        RAISE NOTICE 'password_reset_tokens: Added expiry_time column';
    ELSE
        RAISE NOTICE 'password_reset_tokens: expiry_time column already exists';
    END IF;
END $$;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_tokens(email);

-- Update comments
COMMENT ON COLUMN password_reset_tokens.email IS 'Email address for OTP-based password reset (AuthPasswordResetToken)';
COMMENT ON COLUMN password_reset_tokens.otp IS 'One-time password for email-based reset (AuthPasswordResetToken)';
COMMENT ON COLUMN password_reset_tokens.expiry_time IS 'OTP expiry time (AuthPasswordResetToken)';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'User reference for token-based reset (RbacPasswordResetToken)';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure token for URL-based reset (RbacPasswordResetToken)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiry timestamp (RbacPasswordResetToken)';

-- Validation
DO $$
DECLARE
    v_email_exists BOOLEAN;
    v_otp_exists BOOLEAN;
    v_expiry_time_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_reset_tokens' AND column_name = 'email'
    ) INTO v_email_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_reset_tokens' AND column_name = 'otp'
    ) INTO v_otp_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_reset_tokens' AND column_name = 'expiry_time'
    ) INTO v_expiry_time_exists;
    
    IF NOT (v_email_exists AND v_otp_exists AND v_expiry_time_exists) THEN
        RAISE EXCEPTION 'V019 migration failed: Missing columns in password_reset_tokens';
    END IF;
    
    RAISE NOTICE '✓ V019 validation passed: All password_reset_tokens columns present';
END $$;
