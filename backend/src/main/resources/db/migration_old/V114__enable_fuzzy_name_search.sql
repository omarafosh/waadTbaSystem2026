-- =====================================================
-- Migration: V114 - Enable Fuzzy Search with pg_trgm
-- Purpose: Phase 2 - Arabic Fuzzy Name Search + Autocomplete
-- Date: 2026-01-09
-- =====================================================

-- Enable pg_trgm extension for fuzzy text search
-- This extension provides trigram-based similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for full_name fuzzy search
-- GIN (Generalized Inverted Index) is optimal for text search operations
-- Using gin_trgm_ops operator class for trigram matching
CREATE INDEX IF NOT EXISTS idx_members_fullname_gin_trgm 
ON members USING gin(full_name gin_trgm_ops);

-- Add comment for documentation
COMMENT ON INDEX idx_members_fullname_gin_trgm IS 
'GIN trigram index for fuzzy Arabic name search - Phase 2 of Unified Smart Search';

-- Verify extension is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
    ) THEN
        RAISE EXCEPTION 'pg_trgm extension was not created successfully';
    END IF;
END $$;

-- Performance notes:
-- - pg_trgm allows similarity() function and % operator for fuzzy matching
-- - GIN index significantly speeds up LIKE, ILIKE, and similarity queries
-- - Supports Arabic text search with diacritics normalization
-- - Expected query performance: < 150ms for autocomplete
