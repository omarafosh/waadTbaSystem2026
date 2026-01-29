-- =============================================================================
-- V104: ADD COMPANY PERSISTENCE FIELDS
-- =============================================================================
-- Purpose: Support for Currency and Dynamic Card Number Format in Company Settings
-- =============================================================================

ALTER TABLE companies 
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'SAR',
    ADD COLUMN IF NOT EXISTS card_number_format VARCHAR(200) DEFAULT '[PRO]-[YEAR]-[EMP_NO][REL_SUFFIX]';

COMMENT ON COLUMN companies.currency IS 'System default currency (e.g., SAR, USD, JOD)';
COMMENT ON COLUMN companies.card_number_format IS 'Template for generating smart card numbers';
