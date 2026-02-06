-- ═══════════════════════════════════════════════════════════════════════════
-- V1.22: Performance Optimization Indexes
-- Based on Comprehensive System Testing Report (Feb 2026)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. MEMBERS TABLE OPTIMIZATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Improve search by national number (Exact match & Sorting)
CREATE INDEX IF NOT EXISTS idx_members_national_number ON members(national_number);

-- Improve search by employee number
CREATE INDEX IF NOT EXISTS idx_members_employee_number ON members(employee_number);

-- Improve search by phone
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- Improve search by policy number
CREATE INDEX IF NOT EXISTS idx_members_policy_number ON members(policy_number);

-- Improve foreign key lookups
CREATE INDEX IF NOT EXISTS idx_members_insurance_org ON members(insurance_org_id);
CREATE INDEX IF NOT EXISTS idx_members_benefit_policy ON members(benefit_policy_id);

-- Composite index for common search combinations (Name + National ID)
-- Note: 'full_name' already has an index from V1.06
CREATE INDEX IF NOT EXISTS idx_members_card_search ON members(card_number);

-- 2. CLAIMS TABLE OPTIMIZATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Improve foreign key lookups
CREATE INDEX IF NOT EXISTS idx_claims_insurance_org ON claims(insurance_org_id);
CREATE INDEX IF NOT EXISTS idx_claims_pre_auth ON claims(pre_authorization_id);
-- idx_claims_provider and idx_claims_member already exist in V1.07

-- Improve date-range reporting (Critical for Dashboards)
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_service_date ON claims(service_date);

-- Improve Provider Portal filtering (Provider + Status)
CREATE INDEX IF NOT EXISTS idx_claims_provider_status ON claims(provider_id, status);

-- Improve Member History retrieval (Member + Status)
CREATE INDEX IF NOT EXISTS idx_claims_member_status ON claims(member_id, status);

-- Improve Settlement lookups
CREATE INDEX IF NOT EXISTS idx_claims_payment_ref ON claims(payment_reference);
CREATE INDEX IF NOT EXISTS idx_claims_settled_at ON claims(settled_at);

-- 3. VISITS TABLE OPTIMIZATIONS
-- ═══════════════════════════════════════════════════════════════════════════
-- Table 'visits' is assumed to exist from JPA auto-creation or previous migrations
-- We use IF EXISTS checks implicitly or explicit table check if supported, 
-- but standard CREATE INDEX IF NOT EXISTS is safe enough in PostgreSQL if table exists.

-- Improve lookups by Member (Common access pattern)
CREATE INDEX IF NOT EXISTS idx_visits_member_id ON visits(member_id);

-- Improve lookups by Employer (For HR Dashboards)
CREATE INDEX IF NOT EXISTS idx_visits_employer_id ON visits(employer_org_id);

-- Improve lookups by Provider (For Provider Portal)
CREATE INDEX IF NOT EXISTS idx_visits_provider_id ON visits(provider_id);

-- Improve Date filtering
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);

-- Improve Status filtering
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_visit_type ON visits(visit_type);

-- 4. PROVIDERS TABLE OPTIMIZATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Improve search by Name
CREATE INDEX IF NOT EXISTS idx_providers_name ON providers(name);

-- Improve filtering by City
CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city);

-- Improve active status filtering (already likely covered but ensuring)
CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(active);
