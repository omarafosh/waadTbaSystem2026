-- ═══════════════════════════════════════════════════════════════════════════
-- V057: Complete Reviewer Companies Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE reviewer_companies ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE reviewer_companies ADD COLUMN IF NOT EXISTS medical_director VARCHAR(200);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V057
-- ═══════════════════════════════════════════════════════════════════════════
