-- Expand logo_url column size to support Base64 strings
ALTER TABLE companies ALTER COLUMN logo_url TYPE TEXT;
ALTER TABLE pdf_company_settings ALTER COLUMN logo_url TYPE TEXT;
