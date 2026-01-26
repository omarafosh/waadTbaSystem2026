-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration V038: Add Missing SLA Columns to Pre-Approvals
-- ═══════════════════════════════════════════════════════════════════════════════
-- Author: Copilot
-- Date: 2026-01-12
-- Description: Add missing SLA tracking fields to pre_approvals table to match Entity definition

-- Expected completion date (calculated from submission + SLA days)
ALTER TABLE pre_approvals 
  ADD COLUMN IF NOT EXISTS expected_completion_date DATE;

-- Actual completion date (when approved/rejected)
ALTER TABLE pre_approvals 
  ADD COLUMN IF NOT EXISTS actual_completion_date DATE;

-- Whether pre-approval was completed within SLA
ALTER TABLE pre_approvals 
  ADD COLUMN IF NOT EXISTS within_sla BOOLEAN;

-- Number of business days taken to complete
ALTER TABLE pre_approvals 
  ADD COLUMN IF NOT EXISTS business_days_taken INTEGER;

-- SLA days configured at submission time (snapshot)
ALTER TABLE pre_approvals 
  ADD COLUMN IF NOT EXISTS sla_days_configured INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN pre_approvals.expected_completion_date IS 
  'Expected completion date (submission + SLA business days). Phase 1: SLA Implementation';

COMMENT ON COLUMN pre_approvals.actual_completion_date IS 
  'Actual completion date (when approved/rejected). Phase 1: SLA Implementation';

COMMENT ON COLUMN pre_approvals.within_sla IS 
  'Whether pre-approval was completed within SLA (business_days_taken <= sla_days_configured). Phase 1: SLA Implementation';
