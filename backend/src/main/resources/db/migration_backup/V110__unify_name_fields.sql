-- =============================================================================
-- Migration: V110 - Unify name fields (Organizations & FamilyMembers)
-- Date: 2026-01-08
-- Author: GitHub Copilot
-- Description: Merge dual language fields into single name/full_name
-- =============================================================================

-- ------------------------------
-- PART 1: ORGANIZATIONS
-- ------------------------------

-- Merge nameEn into name only if name is empty
UPDATE organizations
SET name = COALESCE(NULLIF(name, ''), name_en, 'Unknown Organization')
WHERE name IS NULL OR name = '';

-- Set name column NOT NULL and type
ALTER TABLE organizations
ALTER COLUMN name TYPE VARCHAR(255),
ALTER COLUMN name SET NOT NULL;

-- Drop old column safely
ALTER TABLE organizations
DROP COLUMN IF EXISTS name_en;

-- Add comment
COMMENT ON COLUMN organizations.name IS 'Organization name (unified - supports Arabic and English)';


-- ------------------------------
-- PART 2: FAMILY_MEMBERS
-- ------------------------------

-- Add new full_name column if not exists
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);

-- Merge data: prefer Arabic, then English, then fallback
UPDATE family_members
SET full_name = COALESCE(NULLIF(full_name_arabic, ''), full_name_english, 'Unknown')
WHERE full_name IS NULL;

-- Set NOT NULL constraint
ALTER TABLE family_members
ALTER COLUMN full_name SET NOT NULL;

-- Drop old columns safely
ALTER TABLE family_members
DROP COLUMN IF EXISTS full_name_arabic,
DROP COLUMN IF EXISTS full_name_english;

-- Add comment
COMMENT ON COLUMN family_members.full_name IS 'Family member full name (unified - supports Arabic and English)';

-- ------------------------------
-- VERIFICATION QUERIES (Optional)
-- ------------------------------

-- Check for NULL or empty names
-- SELECT COUNT(*) FROM organizations WHERE name IS NULL OR name = '';
-- SELECT COUNT(*) FROM family_members WHERE full_name IS NULL OR full_name = '';

-- Migration Complete ✅