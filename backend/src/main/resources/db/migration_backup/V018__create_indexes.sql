-- ═══════════════════════════════════════════════════════════════════════════
-- V018: Create Performance Indexes - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create additional performance indexes for common queries
-- Dependencies: V001-V017 (all tables must exist)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ───────────────────────────────────────────────────────────────────────────

-- Members: Common lookups by employer + status
CREATE INDEX IF NOT EXISTS idx_members_employer_status 
ON members(employer_organization_id, status);

-- Members: Search by name + employer
CREATE INDEX IF NOT EXISTS idx_members_name_employer 
ON members(employer_organization_id, full_name_arabic);

-- Benefit Policies: Active policies by employer
CREATE INDEX IF NOT EXISTS idx_bp_employer_active_dates 
ON benefit_policies(employer_organization_id, status, effective_date, expiration_date) 
WHERE active = TRUE;

-- Claims: Common dashboard queries
CREATE INDEX IF NOT EXISTS idx_claims_employer_status_date 
ON claims(employer_organization_id, status, service_date);

CREATE INDEX IF NOT EXISTS idx_claims_member_status 
ON claims(member_id, status);

-- Pre-Approvals: Common workflow queries
CREATE INDEX IF NOT EXISTS idx_pa_status_priority_date 
ON pre_approvals(status, priority, request_date) 
WHERE active = TRUE;

-- Eligibility Checks: Recent checks by member
CREATE INDEX IF NOT EXISTS idx_ec_member_timestamp 
ON eligibility_checks(member_id, check_timestamp DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- TEXT SEARCH INDEXES (Optional - for search functionality)
-- ───────────────────────────────────────────────────────────────────────────

-- Members: Full-text search on names
CREATE INDEX IF NOT EXISTS idx_members_name_search 
ON members USING gin(to_tsvector('simple', 
    coalesce(full_name_arabic, '') || ' ' || coalesce(full_name_english, '')));

-- Providers: Full-text search on names
CREATE INDEX IF NOT EXISTS idx_providers_name_search 
ON providers USING gin(to_tsvector('simple', 
    coalesce(name_arabic, '') || ' ' || coalesce(name_english, '')));

-- ───────────────────────────────────────────────────────────────────────────
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ───────────────────────────────────────────────────────────────────────────

-- Active members only
CREATE INDEX IF NOT EXISTS idx_members_active_only 
ON members(employer_organization_id, status) 
WHERE active = TRUE AND status = 'ACTIVE';

-- Active benefit policies only
CREATE INDEX IF NOT EXISTS idx_bp_active_only 
ON benefit_policies(employer_organization_id, effective_date, expiration_date) 
WHERE active = TRUE AND status = 'ACTIVE';

-- Pending claims (for workflow queues)
CREATE INDEX IF NOT EXISTS idx_claims_pending 
ON claims(submission_date, claim_type) 
WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS');

-- Pending pre-approvals (for workflow queues)
CREATE INDEX IF NOT EXISTS idx_pa_pending 
ON pre_approvals(request_date, priority) 
WHERE status IN ('PENDING', 'UNDER_REVIEW');

-- ───────────────────────────────────────────────────────────────────────────
-- FOREIGN KEY INDEXES (ensure JOINs are efficient)
-- ───────────────────────────────────────────────────────────────────────────

-- These may already exist from FK definitions, but ensure they're present
CREATE INDEX IF NOT EXISTS idx_users_org_fk ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_emp_fk ON users(employer_id);
CREATE INDEX IF NOT EXISTS idx_members_emp_org_fk ON members(employer_organization_id);
CREATE INDEX IF NOT EXISTS idx_members_bp_fk ON members(benefit_policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_emp_org_fk ON claims(employer_organization_id);
CREATE INDEX IF NOT EXISTS idx_pc_provider_fk ON provider_contracts(provider_id);
CREATE INDEX IF NOT EXISTS idx_pc_bp_fk ON provider_contracts(benefit_policy_id);

-- ───────────────────────────────────────────────────────────────────────────
-- JSONB INDEXES (for JSON field queries)
-- ───────────────────────────────────────────────────────────────────────────

-- Benefit Policy coverage rules
CREATE INDEX IF NOT EXISTS idx_bp_coverage_rules 
ON benefit_policies USING gin(coverage_rules);

-- Provider working hours and services
CREATE INDEX IF NOT EXISTS idx_providers_services 
ON providers USING gin(services);

-- Eligibility check reasons
CREATE INDEX IF NOT EXISTS idx_ec_reasons 
ON eligibility_checks USING gin(reasons);

-- ═══════════════════════════════════════════════════════════════════════════
-- ANALYZE TABLES FOR QUERY PLANNER
-- ═══════════════════════════════════════════════════════════════════════════

ANALYZE members;
ANALYZE benefit_policies;
ANALYZE claims;
ANALYZE pre_approvals;
ANALYZE providers;
ANALYZE eligibility_checks;
ANALYZE organizations;
ANALYZE employers;
ANALYZE users;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V018
-- ═══════════════════════════════════════════════════════════════════════════
