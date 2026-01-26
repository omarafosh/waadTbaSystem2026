-- ═══════════════════════════════════════════════════════════════════════════
-- V028: Add missing columns to employers table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add columns required by Employer JPA Entity
-- Fixes: Schema-validation: missing column [email] in table [employers]
-- ═══════════════════════════════════════════════════════════════════════════

-- Add email column
ALTER TABLE employers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add any other potentially missing columns from Employer entity
ALTER TABLE employers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE employers ADD COLUMN IF NOT EXISTS fax VARCHAR(50);
ALTER TABLE employers ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE employers ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE employers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE employers ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE employers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V028
-- ═══════════════════════════════════════════════════════════════════════════
