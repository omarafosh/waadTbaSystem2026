-- ═══════════════════════════════════════════════════════════════════════════
-- V029: Add missing columns to feature_flags table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add columns required by FeatureFlag JPA Entity
-- ═══════════════════════════════════════════════════════════════════════════

-- Add audit columns
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add role_filters column (JSON type)
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS role_filters JSON;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V029
-- ═══════════════════════════════════════════════════════════════════════════
