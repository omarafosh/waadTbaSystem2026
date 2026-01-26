-- =====================================================
-- Migration: V113 - Add Index for Card Number Search
-- Purpose: Optimize eligibility check by card number
-- Date: 2026-01-09
-- =====================================================

-- Create index for fast card number lookup
-- This index will make O(1) lookup for exact card number matching
CREATE INDEX IF NOT EXISTS idx_members_card_number 
ON members(card_number) 
WHERE card_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_members_card_number IS 
'Index for fast eligibility check by card number - Phase 1 of Unified Smart Search';
