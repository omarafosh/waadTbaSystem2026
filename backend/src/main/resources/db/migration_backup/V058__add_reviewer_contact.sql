-- ═══════════════════════════════════════════════════════════════════════════
-- V058: Add remaining columns to Reviewer Companies
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE reviewer_companies ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE reviewer_companies ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V058
-- ═══════════════════════════════════════════════════════════════════════════
