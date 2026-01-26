-- ═══════════════════════════════════════════════════════════════════════════
-- V034: Add Missing Medical Services Columns
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add category, category_id, and cost_lyd columns to medical_services
-- Dependencies: V009 (medical_services)
-- ═══════════════════════════════════════════════════════════════════════════

-- Legacy category field (deprecated but still needed for backward compatibility)
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Foreign key to medical_categories
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS category_id BIGINT;

-- Cost field
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS cost_lyd DOUBLE PRECISION;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ms_category'
    ) THEN
        ALTER TABLE medical_services 
            ADD CONSTRAINT fk_ms_category 
            FOREIGN KEY (category_id) 
            REFERENCES medical_categories(id);
    END IF;
END
$$;

-- Create index for category_id
CREATE INDEX IF NOT EXISTS idx_ms_category ON medical_services(category_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V034
-- ═══════════════════════════════════════════════════════════════════════════
