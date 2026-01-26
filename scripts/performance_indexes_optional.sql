-- ============================================================================
-- PHASE 5.B — Performance Indexes (Windows Compatible)
-- 
-- These indexes are designed to optimize the most common query patterns
-- identified during performance analysis.
-- 
-- ⚠️ IMPORTANT FOR WINDOWS/pgAdmin:
--   - CREATE INDEX CONCURRENTLY cannot run inside a transaction
--   - Run each statement SEPARATELY in pgAdmin (not as batch)
--   - OR use the NON-CONCURRENT versions (Option A below)
-- 
-- SAFE: Only creates indexes, NO schema structure changes
-- ============================================================================

-- ============================================================================
-- OPTION A: NON-CONCURRENT INDEXES (Safe for pgAdmin/Windows transactions)
-- ============================================================================

-- 1. CLAIMS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_claims_status_created 
    ON claims (status, created_at DESC) 
    WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_claims_member_id 
    ON claims (member_id);

CREATE INDEX IF NOT EXISTS idx_claims_insurance_org 
    ON claims (insurance_org_id);

CREATE INDEX IF NOT EXISTS idx_claims_active_created 
    ON claims (created_at DESC) 
    WHERE active = true;

-- 2. MEMBERS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_members_employer_org 
    ON members (employer_org_id);

CREATE INDEX IF NOT EXISTS idx_members_employer_id 
    ON members (employer_id);

CREATE INDEX IF NOT EXISTS idx_members_benefit_policy 
    ON members (benefit_policy_id);

CREATE INDEX IF NOT EXISTS idx_members_active_created 
    ON members (created_at DESC) 
    WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_members_civil_id 
    ON members (civil_id);

-- 3. VISITS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_visits_member_id 
    ON visits (member_id);

CREATE INDEX IF NOT EXISTS idx_visits_visit_date 
    ON visits (visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_visits_provider_id 
    ON visits (provider_id);

-- 4. PRE_APPROVALS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_preapprovals_status_created 
    ON pre_approvals (status, created_at DESC) 
    WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_preapprovals_member_id 
    ON pre_approvals (member_id);

CREATE INDEX IF NOT EXISTS idx_preapprovals_provider_id 
    ON pre_approvals (provider_id);

CREATE INDEX IF NOT EXISTS idx_preapprovals_active_created 
    ON pre_approvals (created_at DESC) 
    WHERE active = true;

-- 5. FAMILY_MEMBERS TABLE INDEX (for batch N+1 fix)
CREATE INDEX IF NOT EXISTS idx_family_members_member_id 
    ON family_members (member_id);

-- 6. MEMBER_ATTRIBUTES TABLE INDEX (for batch N+1 fix)
CREATE INDEX IF NOT EXISTS idx_member_attributes_member_id 
    ON member_attributes (member_id);

-- ============================================================================
-- UPDATE STATISTICS (run after creating indexes)
-- ============================================================================
ANALYZE claims;
ANALYZE members;
ANALYZE visits;
ANALYZE pre_approvals;
ANALYZE family_members;
ANALYZE member_attributes;

-- ============================================================================
-- OPTION B: CONCURRENT INDEXES (psql command line ONLY)
-- Run these ONE BY ONE from psql, NOT in pgAdmin transactions
-- ============================================================================

/*
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_status_created_c ON claims (status, created_at DESC) WHERE active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_member_id_c ON claims (member_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_insurance_org_c ON claims (insurance_org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_active_created_c ON claims (created_at DESC) WHERE active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_employer_org_c ON members (employer_org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_employer_id_c ON members (employer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_benefit_policy_c ON members (benefit_policy_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_active_created_c ON members (created_at DESC) WHERE active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_civil_id_c ON members (civil_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_member_id_c ON visits (member_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_visit_date_c ON visits (visit_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_provider_id_c ON visits (provider_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preapprovals_status_created_c ON pre_approvals (status, created_at DESC) WHERE active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preapprovals_member_id_c ON pre_approvals (member_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preapprovals_provider_id_c ON pre_approvals (provider_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preapprovals_active_created_c ON pre_approvals (created_at DESC) WHERE active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_family_members_member_id_c ON family_members (member_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_member_attributes_member_id_c ON member_attributes (member_id);
*/

-- ============================================================================
-- ROLLBACK (if needed):
-- ============================================================================

/*
DROP INDEX IF EXISTS idx_claims_status_created;
DROP INDEX IF EXISTS idx_claims_member_id;
DROP INDEX IF EXISTS idx_claims_insurance_org;
DROP INDEX IF EXISTS idx_claims_active_created;
DROP INDEX IF EXISTS idx_members_employer_org;
DROP INDEX IF EXISTS idx_members_employer_id;
DROP INDEX IF EXISTS idx_members_benefit_policy;
DROP INDEX IF EXISTS idx_members_active_created;
DROP INDEX IF EXISTS idx_members_civil_id;
DROP INDEX IF EXISTS idx_visits_member_id;
DROP INDEX IF EXISTS idx_visits_visit_date;
DROP INDEX IF EXISTS idx_visits_provider_id;
DROP INDEX IF EXISTS idx_preapprovals_status_created;
DROP INDEX IF EXISTS idx_preapprovals_member_id;
DROP INDEX IF EXISTS idx_preapprovals_provider_id;
DROP INDEX IF EXISTS idx_preapprovals_active_created;
DROP INDEX IF EXISTS idx_family_members_member_id;
DROP INDEX IF EXISTS idx_member_attributes_member_id;
*/

-- ============================================================================
-- END
-- ============================================================================
