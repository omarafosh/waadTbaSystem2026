-- V010__claim_attachments_update.sql
-- Update claim_attachments table with new file storage fields

-- Add new columns for file storage integration
ALTER TABLE claim_attachments 
ADD COLUMN IF NOT EXISTS file_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN claim_attachments.file_key IS 'Unique file identifier in storage system (folder/uuid_filename)';
COMMENT ON COLUMN claim_attachments.original_file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN claim_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN claim_attachments.uploaded_by IS 'Username or user ID who uploaded the file';
COMMENT ON COLUMN claim_attachments.attachment_type IS 'Type of attachment: INVOICE, MEDICAL_REPORT, PRESCRIPTION, LAB_RESULT, XRAY, OTHER';

-- Create index on claim_id for faster queries
CREATE INDEX IF NOT EXISTS idx_claim_attachments_claim_id ON claim_attachments(claim_id);

-- Create index on attachment_type for filtering
CREATE INDEX IF NOT EXISTS idx_claim_attachments_type ON claim_attachments(attachment_type);
