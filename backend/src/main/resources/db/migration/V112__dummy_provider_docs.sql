-- Insert Dummy Provider if not exists
INSERT INTO providers (name, license_number, provider_type, active, created_at, updated_at) 
VALUES ('مستشفى الاختبار الدولي', 'LIC-TEST-001', 'HOSPITAL', true, NOW(), NOW())
ON CONFLICT (license_number) DO NOTHING;

-- Get the ID of the provider (assuming it's serial, might need customization)
DO $$
DECLARE 
    pid BIGINT;
BEGIN
    SELECT id INTO pid FROM providers WHERE license_number = 'LIC-TEST-001';

    -- Insert Dummy Documents
    INSERT INTO provider_documents (provider_id, type, file_name, file_url, expiry_date, active, created_at, updated_at)
    VALUES 
    (pid, 'LICENSE', 'medical_license_2026.pdf', 'docs/license.pdf', '2027-01-01', true, NOW(), NOW()),
    (pid, 'TAX_CERTIFICATE', 'tax_cert.pdf', 'docs/tax.pdf', '2026-12-31', true, NOW(), NOW());
END $$;
