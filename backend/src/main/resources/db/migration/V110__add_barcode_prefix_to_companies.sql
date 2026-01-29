-- Add barcode_prefix column to companies table (System Settings)
ALTER TABLE companies ADD COLUMN barcode_prefix VARCHAR(20) DEFAULT 'WAAD';

-- Update existing records to have the default value
UPDATE companies SET barcode_prefix = 'WAAD' WHERE barcode_prefix IS NULL;
