-- Add notes column to chronic_conditions
ALTER TABLE chronic_conditions ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);

-- Content from V999__schema_alignment_missing_columns.sql

-- Create table: password_reset_token
CREATE TABLE IF NOT EXISTS password_reset_token (
    email VARCHAR(255),
    expiry_time VARCHAR(255),
    id BIGINT,
    otp VARCHAR(255)
);

-- Table: medical_packages
ALTER TABLE medical_packages 
    ADD COLUMN IF NOT EXISTS total_coverage_limit DOUBLE PRECISION;

-- Table: member_import_errors
ALTER TABLE member_import_errors 
    ADD COLUMN IF NOT EXISTS error_field VARCHAR(255);
ALTER TABLE member_import_errors 
    ADD COLUMN IF NOT EXISTS row_data VARCHAR(255);

-- Table: visits
ALTER TABLE visits 
    ADD COLUMN IF NOT EXISTS active BOOLEAN;
ALTER TABLE visits 
    ADD COLUMN IF NOT EXISTS diagnosis VARCHAR(255);
ALTER TABLE visits 
    ADD COLUMN IF NOT EXISTS employer_org_id VARCHAR(255);
ALTER TABLE visits 
    ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE visits 
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2);
ALTER TABLE visits 
    ADD COLUMN IF NOT EXISTS treatment VARCHAR(255);
