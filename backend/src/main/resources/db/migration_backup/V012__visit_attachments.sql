-- V012__visit_attachments.sql
-- Create visit_attachments table for medical visit file attachments
-- (radiology, lab results, prescriptions, etc.)

CREATE TABLE IF NOT EXISTS visit_attachments (
    id BIGSERIAL PRIMARY KEY,
    visit_id BIGINT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500),
    file_key VARCHAR(500),
    file_type VARCHAR(100),
    file_size BIGINT,
    attachment_type VARCHAR(50),
    description VARCHAR(1000),
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE visit_attachments IS 'File attachments for patient visits (medical images, lab results, prescriptions)';
COMMENT ON COLUMN visit_attachments.file_key IS 'Unique file identifier in storage system (folder/uuid_filename)';
COMMENT ON COLUMN visit_attachments.original_file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN visit_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN visit_attachments.uploaded_by IS 'Username or user ID who uploaded the file';
COMMENT ON COLUMN visit_attachments.attachment_type IS 'Type: XRAY, MRI, CT_SCAN, ULTRASOUND, LAB_RESULT, ECG, PRESCRIPTION, MEDICAL_REPORT, OTHER';
COMMENT ON COLUMN visit_attachments.description IS 'Optional notes or description about the attachment';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visit_attachments_visit_id 
    ON visit_attachments(visit_id);

CREATE INDEX IF NOT EXISTS idx_visit_attachments_type 
    ON visit_attachments(attachment_type);

CREATE INDEX IF NOT EXISTS idx_visit_attachments_created_at 
    ON visit_attachments(created_at DESC);
