-- =============================================================================
-- V100: ENTERPRISE SMART CARD NUMBERING
-- =============================================================================
-- Purpose: Support for [R]-[PRO]-[COMP]-[ID] structure
-- R = Relationship (P, D, S, C, T, G)
-- PRO = Provider Code (3 chars)
-- COMP = Company Code
-- ID = Employee Number or Random 6-digit
-- =============================================================================

-- 1. Add supporting columns to members table
ALTER TABLE members 
    ADD COLUMN IF NOT EXISTS relationship_code VARCHAR(5) DEFAULT 'P',
    ADD COLUMN IF NOT EXISTS provider_code VARCHAR(3),
    ADD COLUMN IF NOT EXISTS company_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS internal_id_part VARCHAR(20),
    ADD COLUMN IF NOT EXISTS card_activated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS is_smart_card BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN members.relationship_code IS 'R: P=Principal, D=Dependent, S=Spouse, C=Child, T=Temporary, G=Guest';
COMMENT ON COLUMN members.provider_code IS 'PRO: Exactly 3 uppercase English letters';
COMMENT ON COLUMN members.company_code IS 'COMP: Insurance company code';
COMMENT ON COLUMN members.internal_id_part IS 'ID: Employee number or 6-digit identifier';

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_members_smart_card_parts 
    ON members(relationship_code, provider_code, company_code, internal_id_part);

-- 3. Sequence for unique ID generation (if employee number not available)
CREATE SEQUENCE IF NOT EXISTS seq_smart_card_random_id 
    START WITH 100000 
    INCREMENT BY 1 
    MAXVALUE 999999 
    CYCLE;

COMMENT ON SEQUENCE seq_smart_card_random_id IS 'Generates unique 6-digit IDs for members without employee numbers';
