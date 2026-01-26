-- ═══════════════════════════════════════════════════════════════════════════
-- V017: Seed Sample Data (Employers, Organizations, Benefit Policies) - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Seed sample business data for testing and development
-- Dependencies: V001-V016
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- SEED ORGANIZATIONS
-- ───────────────────────────────────────────────────────────────────────────

-- TPA Organization (System Owner)
INSERT INTO organizations (code, name, name_ar, type, active, config) VALUES
('TPA001', 'TBA WAAD TPA', 'وعد لادارة النفقات الطبية', 'TPA', TRUE, '{"is_primary": true}')
ON CONFLICT (code, type) DO NOTHING;

-- Sample Employers
INSERT INTO organizations (code, name, name_ar, type, active) VALUES
('EMP001', 'LCC LIBYAN Company', 'شركة الليبة للأسمنت', 'EMPLOYER', TRUE),
('EMP002', 'Kuwait Airways', 'الخطوط الجوية الكويتية', 'EMPLOYER', TRUE),
('EMP003', 'National Bank of Kuwait', 'بنك الكويت الوطني', 'EMPLOYER', TRUE)
ON CONFLICT (code, type) DO NOTHING;

-- Sample Providers
INSERT INTO organizations (code, name, name_ar, type, active) VALUES
('PROV001', 'Dar Al Shifa Hospital', 'مستشفى دار الشفاء', 'PROVIDER', TRUE),
('PROV002', 'Royal Hayat Hospital', 'مستشفى رويال حياة', 'PROVIDER', TRUE),
('PROV003', 'Al Mowasat Hospital', 'مستشفى المواساة', 'PROVIDER', TRUE)
ON CONFLICT (code, type) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- SEED EMPLOYERS
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO employers (code, name_ar, name_en, status, organization_id, sector, country, active)
SELECT 
    'KOC',
    'شركة نفط الكويت',
    'Kuwait Oil Company',
    'ACTIVE'::employer_status,
    o.id,
    'Oil & Gas',
    'Kuwait',
    TRUE
FROM organizations o WHERE o.code = 'EMP001' AND o.type = 'EMPLOYER'
ON CONFLICT (code) DO NOTHING;

INSERT INTO employers (code, name_ar, name_en, status, organization_id, sector, country, active)
SELECT 
    'KAC',
    'الخطوط الجوية الكويتية',
    'Kuwait Airways',
    'ACTIVE'::employer_status,
    o.id,
    'Aviation',
    'Kuwait',
    TRUE
FROM organizations o WHERE o.code = 'EMP002' AND o.type = 'EMPLOYER'
ON CONFLICT (code) DO NOTHING;

INSERT INTO employers (code, name_ar, name_en, status, organization_id, sector, country, active)
SELECT 
    'NBK',
    'بنك الكويت الوطني',
    'National Bank of Kuwait',
    'ACTIVE'::employer_status,
    o.id,
    'Banking',
    'Kuwait',
    TRUE
FROM organizations o WHERE o.code = 'EMP003' AND o.type = 'EMPLOYER'
ON CONFLICT (code) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- SEED BENEFIT POLICIES
-- ───────────────────────────────────────────────────────────────────────────

-- Gold Policy for KOC
INSERT INTO benefit_policies (
    policy_code, name, name_ar, description, status,
    employer_organization_id, effective_date, expiration_date,
    annual_limit, individual_limit, family_limit,
    deductible, copay_percentage, waiting_period_days,
    network_type, coverage_type, tier_level, active
)
SELECT 
    'POL-KOC-GOLD-2025',
    'KOC Gold Coverage',
    'تغطية ذهبية - شركة نفط الكويت',
    'Comprehensive gold tier coverage for KOC employees',
    'ACTIVE'::benefit_policy_status,
    o.id,
    '2025-01-01',
    '2025-12-31',
    50000.00,
    20000.00,
    100000.00,
    50.00,
    10.00,
    30,
    'PREFERRED',
    'COMPREHENSIVE',
    'GOLD',
    TRUE
FROM organizations o WHERE o.code = 'EMP001' AND o.type = 'EMPLOYER'
ON CONFLICT (policy_code) DO NOTHING;

-- Silver Policy for Kuwait Airways
INSERT INTO benefit_policies (
    policy_code, name, name_ar, description, status,
    employer_organization_id, effective_date, expiration_date,
    annual_limit, individual_limit, family_limit,
    deductible, copay_percentage, waiting_period_days,
    network_type, coverage_type, tier_level, active
)
SELECT 
    'POL-KAC-SILVER-2025',
    'Kuwait Airways Silver Coverage',
    'تغطية فضية - الخطوط الكويتية',
    'Standard silver tier coverage for Kuwait Airways employees',
    'ACTIVE'::benefit_policy_status,
    o.id,
    '2025-01-01',
    '2025-12-31',
    30000.00,
    15000.00,
    60000.00,
    100.00,
    15.00,
    60,
    'STANDARD',
    'STANDARD',
    'SILVER',
    TRUE
FROM organizations o WHERE o.code = 'EMP002' AND o.type = 'EMPLOYER'
ON CONFLICT (policy_code) DO NOTHING;

-- Platinum Policy for NBK
INSERT INTO benefit_policies (
    policy_code, name, name_ar, description, status,
    employer_organization_id, effective_date, expiration_date,
    annual_limit, individual_limit, family_limit,
    deductible, copay_percentage, waiting_period_days,
    network_type, coverage_type, tier_level, active
)
SELECT 
    'POL-NBK-PLATINUM-2025',
    'NBK Platinum Executive Coverage',
    'تغطية بلاتينية - بنك الكويت الوطني',
    'Premium platinum tier coverage for NBK executives',
    'ACTIVE'::benefit_policy_status,
    o.id,
    '2025-01-01',
    '2025-12-31',
    100000.00,
    50000.00,
    200000.00,
    0.00,
    5.00,
    0,
    'VIP',
    'PREMIUM',
    'PLATINUM',
    TRUE
FROM organizations o WHERE o.code = 'EMP003' AND o.type = 'EMPLOYER'
ON CONFLICT (policy_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V017
-- ═══════════════════════════════════════════════════════════════════════════
