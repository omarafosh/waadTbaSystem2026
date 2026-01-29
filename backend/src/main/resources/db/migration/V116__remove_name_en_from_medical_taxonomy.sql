-- Remove English name columns from medical taxonomy tables
-- Unified Name Unification Phase

-- Remove from medical_categories
ALTER TABLE medical_categories DROP COLUMN IF EXISTS name_en;

-- Remove from medical_services
ALTER TABLE medical_services DROP COLUMN IF EXISTS name_en;
