-- =============================================================================
-- V105: ADD COMPANY FONT PERSISTENCE
-- =============================================================================
-- Purpose: Support for dynamic font switching (Tajawal / Cairo)
-- =============================================================================

ALTER TABLE companies 
    ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Tajawal';

COMMENT ON COLUMN companies.font_family IS 'Preferred system font family (Tajawal, Cairo)';
