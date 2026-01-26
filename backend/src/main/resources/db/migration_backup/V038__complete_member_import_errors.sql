-- ═══════════════════════════════════════════════════════════════════════════
-- V038: Complete Member Import Errors Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE member_import_errors ADD COLUMN IF NOT EXISTS error_field VARCHAR(100);
ALTER TABLE member_import_errors ADD COLUMN IF NOT EXISTS error_type VARCHAR(50);
ALTER TABLE member_import_errors ADD COLUMN IF NOT EXISTS row_data JSONB;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V038
-- ═══════════════════════════════════════════════════════════════════════════
