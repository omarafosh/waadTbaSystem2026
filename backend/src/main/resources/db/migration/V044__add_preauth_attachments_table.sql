-- ═══════════════════════════════════════════════════════════════════════════════
-- V044: Add Pre-Authorization Attachments Table
-- ═══════════════════════════════════════════════════════════════════════════════
-- Date: 2026-01-15
-- Purpose: Support file attachments for pre-authorizations
-- Related: CLAIMS_PREAUTH_CLEANUP_REPORT.md
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create the pre_authorization_attachments table
CREATE TABLE IF NOT EXISTS pre_authorization_attachments (
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign key to pre-authorizations
    pre_authorization_id BIGINT NOT NULL,
    
    -- File metadata
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    
    -- Attachment classification
    attachment_type VARCHAR(100),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    -- Foreign key constraint
    CONSTRAINT fk_preauth_attachment_preauth
        FOREIGN KEY (pre_authorization_id)
        REFERENCES pre_authorizations(id)
        ON DELETE CASCADE
);

-- Performance index for querying attachments by pre-authorization
CREATE INDEX IF NOT EXISTS idx_preauth_attachments_preauth_id 
    ON pre_authorization_attachments(pre_authorization_id);

-- Index for file type queries (useful for filtering by document type)
CREATE INDEX IF NOT EXISTS idx_preauth_attachments_file_type 
    ON pre_authorization_attachments(file_type);

-- Comments for documentation
COMMENT ON TABLE pre_authorization_attachments IS 'Stores file attachments for pre-authorizations (medical reports, lab results, etc.)';
COMMENT ON COLUMN pre_authorization_attachments.pre_authorization_id IS 'Reference to the parent pre-authorization';
COMMENT ON COLUMN pre_authorization_attachments.original_file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN pre_authorization_attachments.stored_file_name IS 'UUID-based filename for storage';
COMMENT ON COLUMN pre_authorization_attachments.file_path IS 'Full path to the stored file on disk';
COMMENT ON COLUMN pre_authorization_attachments.file_type IS 'MIME type (e.g., application/pdf, image/jpeg)';
COMMENT ON COLUMN pre_authorization_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN pre_authorization_attachments.attachment_type IS 'Business classification (MEDICAL_REPORT, LAB_RESULT, PRESCRIPTION, OTHER)';

-- Log migration
DO $$
BEGIN
    RAISE NOTICE '✅ V044: Pre-authorization attachments table created successfully';
END $$;
