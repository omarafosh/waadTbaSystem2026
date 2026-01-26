-- ============================================================================
-- Migration: Add branding and identity fields to companies table
-- Version: V023
-- Date: 2025-01-02
-- Purpose: Support company branding and identity (logo, contact info, etc.)
-- ============================================================================
--
-- This migration adds branding fields to support:
-- - Company logo
-- - Contact information (phone, email, address)
-- - Business details (website, business type, tax number)
--
-- All fields are optional (NULL allowed) - if not provided, they won't be
-- displayed in UI, reports, or PDFs.
--
-- ============================================================================

-- Add branding and identity columns
ALTER TABLE companies 
ADD COLUMN logo_url VARCHAR(500),
ADD COLUMN phone VARCHAR(50),
ADD COLUMN email VARCHAR(100),
ADD COLUMN address TEXT,
ADD COLUMN website VARCHAR(200),
ADD COLUMN business_type VARCHAR(100),
ADD COLUMN tax_number VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN companies.logo_url IS 'Company logo URL/path (optional)';
COMMENT ON COLUMN companies.phone IS 'Primary contact phone number (optional)';
COMMENT ON COLUMN companies.email IS 'Primary contact email (optional)';
COMMENT ON COLUMN companies.address IS 'Physical/registered address (optional)';
COMMENT ON COLUMN companies.website IS 'Company website URL (optional)';
COMMENT ON COLUMN companies.business_type IS 'Type of business, e.g., Third Party Administrator (optional)';
COMMENT ON COLUMN companies.tax_number IS 'Tax/Commercial registration number (optional)';

-- Optionally, set default values for TBA company (if exists)
UPDATE companies 
SET 
    business_type = 'Third Party Administrator',
    email = 'info@tba.sa',
    phone = '+966-XX-XXX-XXXX'
WHERE code = 'TBA' AND business_type IS NULL;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Branding fields added to companies table successfully.';
    RAISE NOTICE 'All fields are optional. If NULL, they will not be displayed in UI or reports.';
END $$;
