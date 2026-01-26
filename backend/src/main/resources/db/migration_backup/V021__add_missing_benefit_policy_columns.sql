-- ═══════════════════════════════════════════════════════════════════════════
-- V021: Add Missing Columns to benefit_policies Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add columns required by BenefitPolicy JPA Entity
-- Fixes: Schema-validation: missing column [covered_members_count]
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add covered_members_count column
ALTER TABLE benefit_policies ADD COLUMN IF NOT EXISTS covered_members_count INTEGER DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V021
-- ═══════════════════════════════════════════════════════════════════════════
