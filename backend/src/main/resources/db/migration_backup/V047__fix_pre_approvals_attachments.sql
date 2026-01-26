-- ═══════════════════════════════════════════════════════════════════════════
-- V047: Fix Pre-Approvals Attachments Column Type
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Entity expects VARCHAR(2000) but DB has JSONB

-- Add temporary column
ALTER TABLE pre_approvals ADD COLUMN IF NOT EXISTS attachments_varchar VARCHAR(2000);

-- Copy data
UPDATE pre_approvals SET attachments_varchar = attachments::TEXT WHERE attachments IS NOT NULL;

-- Drop old column if exists
ALTER TABLE pre_approvals DROP COLUMN IF EXISTS attachments;

-- Rename new column
ALTER TABLE pre_approvals RENAME COLUMN attachments_varchar TO attachments;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V047
-- ═══════════════════════════════════════════════════════════════════════════
