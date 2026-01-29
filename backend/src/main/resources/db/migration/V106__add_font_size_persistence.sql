-- =============================================================================
-- V106: ADD COMPANY UI PERSISTENCE (FONT SIZE)
-- =============================================================================
-- Purpose: Support for dynamic font scaling (12px, 14px, etc.)
-- =============================================================================

ALTER TABLE companies 
    ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 12;

COMMENT ON COLUMN companies.font_size IS 'Preferred system font size (12, 14)';
