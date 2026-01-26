-- V011__preauth_attachments.sql
-- Create preauth_attachments table for pre-authorization file attachments

CREATE TABLE IF NOT EXISTS preauth_attachments (
    id BIGSERIAL PRIMARY KEY,
    pre_approval_id BIGINT NOT NULL REFERENCES pre_approvals(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500),
    file_key VARCHAR(500),
    file_type VARCHAR(100),
    file_size BIGINT,
    attachment_type VARCHAR(50),
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE preauth_attachments IS 'File attachments for pre-authorization requests';
COMMENT ON COLUMN preauth_attachments.file_key IS 'Unique file identifier in storage system (folder/uuid_filename)';
COMMENT ON COLUMN preauth_attachments.original_file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN preauth_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN preauth_attachments.uploaded_by IS 'Username or user ID who uploaded the file';
COMMENT ON COLUMN preauth_attachments.attachment_type IS 'Type: REQUEST_FORM, MEDICAL_REPORT, XRAY, LAB_RESULT, DOCTOR_RECOMMENDATION, OTHER';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preauth_attachments_pre_approval_id 
    ON preauth_attachments(pre_approval_id);

CREATE INDEX IF NOT EXISTS idx_preauth_attachments_type 
    ON preauth_attachments(attachment_type);

CREATE INDEX IF NOT EXISTS idx_preauth_attachments_created_at 
    ON preauth_attachments(created_at DESC);
