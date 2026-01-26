-- ============================================================================
-- V052: Add total_coverage_limit column to medical_packages table
-- ============================================================================
-- Purpose: Fix entity-database mismatch for MedicalPackage.totalCoverageLimit
-- Date: 2026-01-18
-- ============================================================================

-- Add the missing column
ALTER TABLE medical_packages 
    ADD COLUMN IF NOT EXISTS total_coverage_limit DOUBLE PRECISION;

-- Add comment for documentation
COMMENT ON COLUMN medical_packages.total_coverage_limit IS 'Total coverage limit for this medical package';
