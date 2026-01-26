-- ═══════════════════════════════════════════════════════════════════════════
-- V060: Make permissions.code nullable for RBAC initialization
-- TBA WAAD System - Schema Fix
-- ═══════════════════════════════════════════════════════════════════════════
-- The RbacDataInitializer creates permissions without code
-- We'll make code nullable and auto-fill it from name if null

ALTER TABLE permissions ALTER COLUMN code DROP NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V060
-- ═══════════════════════════════════════════════════════════════════════════
