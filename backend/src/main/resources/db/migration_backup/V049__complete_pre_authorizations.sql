-- ═══════════════════════════════════════════════════════════════════════════
-- V049: Complete Pre-Authorizations Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS approval_expiry_date DATE;
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS expected_service_date DATE;
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS service_from_date DATE;
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS service_to_date DATE;
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS number_of_days INTEGER;
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS reviewer_id BIGINT;
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS request_notes VARCHAR(3000);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS reviewer_notes VARCHAR(3000);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(2000);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS attachments VARCHAR(2000);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(200);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS doctor_specialty VARCHAR(100);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS procedure_codes VARCHAR(2000);
ALTER TABLE pre_authorizations ADD COLUMN IF NOT EXISTS procedure_descriptions VARCHAR(2000);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V049
-- ═══════════════════════════════════════════════════════════════════════════
