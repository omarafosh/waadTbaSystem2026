-- Add barcode_prefix column to organizations table
ALTER TABLE organizations ADD COLUMN barcode_prefix VARCHAR(20) DEFAULT 'WAAD';

-- Update existing records to have the default value
UPDATE organizations SET barcode_prefix = 'WAAD' WHERE barcode_prefix IS NULL;
