-- ═══════════════════════════════════════════════════════════════════════════
-- V033: Add Missing Medical Packages Columns
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add total_coverage_limit column to medical_packages
-- Dependencies: V009 (medical_packages), V031
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE medical_packages ADD COLUMN IF NOT EXISTS total_coverage_limit DOUBLE PRECISION;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V033
-- ═══════════════════════════════════════════════════════════════════════════
