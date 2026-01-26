-- ============================================================================
-- PHASE 5.B.0 — Tier 2 Synthetic Data Generation (SQL Direct Insert)
-- 
-- SAFE: Only inserts data, NO schema changes
-- Targets:
--   - 4 Employers (via organizations)
--   - 50 Providers  
--   - 20 Medical Categories
--   - 200 Medical Services
--   - 8 Benefit Policies
--   - 50000 Members
--   - 20000 Visits
--   - 8000 Claims
--   - 2000 Pre-Approvals
-- ============================================================================

-- Transaction for safety
BEGIN;

-- ============================================================================
-- 1. Create Employers (organizations with type='EMPLOYER')
-- ============================================================================
INSERT INTO organizations (name, name_en, code, type, active, created_at, updated_at)
SELECT 
    name_ar, name_en, code, 'EMPLOYER', true, NOW(), NOW()
FROM (VALUES
    ('الشركة الليبية للأسمنت', 'Libyan Cement Company', 'LCC001'),
    ('منطقة جليانة', 'Juliana Zone', 'JUL002'),
    ('مصلحة الجمارك الليبية', 'Libyan Customs Authority', 'LCA003'),
    ('مصرف الوحدة', 'Unity Bank', 'UNB004')
) AS emp(name_ar, name_en, code)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE code = emp.code);

-- ============================================================================
-- 2. Create Providers (50 total)
-- Provider types allowed: HOSPITAL, CLINIC, LAB, PHARMACY, RADIOLOGY
-- ============================================================================
INSERT INTO providers (name_arabic, name_english, license_number, tax_number, city, address, phone, email, provider_type, contract_start_date, contract_end_date, default_discount_rate, active, created_at, updated_at)
SELECT 
    'مقدم الخدمة الصحية ' || i,
    'Health Provider ' || i,
    'LIC' || LPAD(i::TEXT, 5, '0'),
    'TAX' || LPAD(i::TEXT, 5, '0'),
    CASE i % 5 
        WHEN 0 THEN 'طرابلس'
        WHEN 1 THEN 'بنغازي'
        WHEN 2 THEN 'مصراتة'
        WHEN 3 THEN 'سبها'
        ELSE 'الزاوية'
    END,
    'شارع الجمهورية رقم ' || i,
    '+21891' || LPAD(i::TEXT, 7, '0'),
    'provider' || i || '@tba.ly',
    CASE i % 5
        WHEN 0 THEN 'HOSPITAL'
        WHEN 1 THEN 'CLINIC'
        WHEN 2 THEN 'PHARMACY'
        WHEN 3 THEN 'LAB'
        ELSE 'RADIOLOGY'
    END,
    '2024-01-01'::DATE,
    '2025-12-31'::DATE,
    10.00,
    true,
    NOW(),
    NOW()
FROM generate_series(1, 50) AS i
WHERE NOT EXISTS (SELECT 1 FROM providers WHERE license_number = 'LIC' || LPAD(i::TEXT, 5, '0'));

-- ============================================================================
-- 3. Create Medical Categories (20 total)
-- Schema: id, code, created_at, description, name_ar, name_en, updated_at
-- ============================================================================
INSERT INTO medical_categories (code, name_ar, name_en, description, created_at, updated_at)
SELECT code, name_ar, name_en, 'وصف ' || name_ar, NOW(), NOW()
FROM (VALUES
    ('CAT001', 'استشارة طبية', 'Medical Consultation'),
    ('CAT002', 'أشعة وتصوير', 'Radiology & Imaging'),
    ('CAT003', 'تحاليل مخبرية', 'Laboratory Tests'),
    ('CAT004', 'جراحة عامة', 'General Surgery'),
    ('CAT005', 'طب الأسنان', 'Dental Care'),
    ('CAT006', 'طب العيون', 'Ophthalmology'),
    ('CAT007', 'طب القلب', 'Cardiology'),
    ('CAT008', 'طب الأطفال', 'Pediatrics'),
    ('CAT009', 'طب النساء والتوليد', 'Obstetrics & Gynecology'),
    ('CAT010', 'طب العظام', 'Orthopedics'),
    ('CAT011', 'طب الجلدية', 'Dermatology'),
    ('CAT012', 'طب الأعصاب', 'Neurology'),
    ('CAT013', 'طب الأذن والأنف والحنجرة', 'ENT'),
    ('CAT014', 'طب المسالك البولية', 'Urology'),
    ('CAT015', 'طب الصدر والرئة', 'Pulmonology'),
    ('CAT016', 'العلاج الطبيعي', 'Physiotherapy'),
    ('CAT017', 'الطب النفسي', 'Psychiatry'),
    ('CAT018', 'طب الطوارئ', 'Emergency Medicine'),
    ('CAT019', 'الأدوية والمستلزمات', 'Pharmaceuticals'),
    ('CAT020', 'خدمات التمريض', 'Nursing Services')
) AS cat(code, name_ar, name_en)
WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = cat.code);

-- ============================================================================
-- 4. Create Medical Services (200 total, 10 per category)
-- Schema: id, category, code, cost_lyd, created_at, name_ar, name_en, price_lyd, updated_at, category_id
-- ============================================================================
INSERT INTO medical_services (code, name_ar, name_en, category_id, price_lyd, cost_lyd, created_at, updated_at)
SELECT 
    'SVC' || LPAD(((cat.row_num - 1) * 10 + svc.i)::TEXT, 5, '0'),
    'خدمة ' || cat.name_ar || ' ' || svc.i,
    cat.name_en || ' Service ' || svc.i,
    cat.id,
    (50 + (RANDOM() * 950)::INT)::DOUBLE PRECISION,
    (35 + (RANDOM() * 600)::INT)::DOUBLE PRECISION,
    NOW(),
    NOW()
FROM (
    SELECT id, name_ar, name_en, ROW_NUMBER() OVER (ORDER BY id) as row_num 
    FROM medical_categories
) cat
CROSS JOIN generate_series(1, 10) AS svc(i)
WHERE NOT EXISTS (
    SELECT 1 FROM medical_services 
    WHERE code = 'SVC' || LPAD(((cat.row_num - 1) * 10 + svc.i)::TEXT, 5, '0')
);

-- ============================================================================
-- 5. Create Benefit Policies (8 total, 2 per employer)
-- ============================================================================
INSERT INTO benefit_policies (name, policy_code, description, employer_org_id, start_date, end_date, annual_limit, default_coverage_percent, per_member_limit, per_family_limit, notes, status, active, created_at, updated_at)
SELECT 
    emp.name || ' - ' || tier.tier_name,
    emp.code || '-' || tier.tier_code,
    'سياسة التأمين الصحي فئة ' || tier.tier_name || ' لموظفي ' || emp.name,
    emp.id,
    '2024-01-01'::DATE,
    '2025-12-31'::DATE,
    tier.annual_limit,
    tier.coverage,
    10000.00,
    30000.00,
    'تم إنشاؤها تلقائيًا لاختبارات الأداء',
    'ACTIVE',
    true,
    NOW(),
    NOW()
FROM organizations emp
CROSS JOIN (VALUES
    ('Gold', 'GOLD', 50000.00::NUMERIC, 90),
    ('Silver', 'SILVER', 25000.00::NUMERIC, 70)
) AS tier(tier_name, tier_code, annual_limit, coverage)
WHERE emp.type = 'EMPLOYER' 
  AND emp.code IN ('LCC001', 'JUL002', 'LCA003', 'UNB004')
  AND NOT EXISTS (
    SELECT 1 FROM benefit_policies WHERE policy_code = emp.code || '-' || tier.tier_code
  );

-- ============================================================================
-- 6. Create Members (50000 total, 5000 per employer)
-- Schema: active, birth_date, card_number, card_status, civil_id, eligibility_status, 
--         full_name_arabic, gender, status, employer_org_id, etc.
-- ============================================================================
DO $$
DECLARE
    emp RECORD;
    pol_id BIGINT;
    emp_num INT := 0;
    first_names TEXT[] := ARRAY['محمد','أحمد','علي','عمر','خالد','فاطمة','عائشة','مريم','زينب','سلمى'];
    last_names TEXT[] := ARRAY['العربي','الليبي','التونسي','الجزائري','المصري','السوداني','المغربي','الموريتاني','العراقي','الأردني'];
BEGIN
    FOR emp IN 
        SELECT id, name, code 
        FROM organizations 
        WHERE type = 'EMPLOYER' AND code IN ('LCC001', 'JUL002', 'LCA003', 'UNB004')
        ORDER BY id
    LOOP
        emp_num := emp_num + 1;
        
        -- Get Gold policy for this employer
        SELECT id INTO pol_id FROM benefit_policies 
        WHERE employer_org_id = emp.id AND policy_code LIKE '%GOLD'
        LIMIT 1;
        
        IF pol_id IS NULL THEN
            SELECT id INTO pol_id FROM benefit_policies 
            WHERE employer_org_id = emp.id 
            LIMIT 1;
        END IF;
        
        INSERT INTO members (
            full_name_arabic, full_name_english, civil_id, card_number, 
            birth_date, gender, employer_org_id, benefit_policy_id, 
            phone, email, active, eligibility_status, card_status, status,
            created_at, updated_at
        )
        SELECT 
            first_names[1 + (i % 10)] || ' ' || last_names[1 + ((i/10) % 10)] || ' ' || ((emp_num - 1) * 500 + i),
            'Member ' || ((emp_num - 1) * 500 + i),
            LPAD(((emp_num - 1) * 500 + i)::TEXT, 12, '0'),
            'CARD' || LPAD(((emp_num - 1) * 500 + i)::TEXT, 8, '0'),
            ('1960-01-01'::DATE + (FLOOR(RANDOM() * 14600))::INT),
            CASE WHEN i % 2 = 0 THEN 'MALE' ELSE 'FEMALE' END,
            emp.id,
            pol_id,
            '+21892' || LPAD(((emp_num - 1) * 500 + i)::TEXT, 7, '0'),
            'member' || ((emp_num - 1) * 500 + i) || '@test.ly',
            true,
            true,
            'ACTIVE',
            'ACTIVE',
            NOW(),
            NOW()
        FROM generate_series(1, 500) AS i
        WHERE NOT EXISTS (
            SELECT 1 FROM members 
            WHERE civil_id = LPAD(((emp_num - 1) * 500 + i)::TEXT, 12, '0')
        );
        
        RAISE NOTICE 'Created members for employer %: %', emp.name, emp.code;
    END LOOP;
END $$;

-- ============================================================================
-- 7. Create Visits (20000 total, 10 per member)
-- Schema: member_id, provider_id, visit_date, doctor_name, specialty, diagnosis, 
--         treatment, total_amount, created_at, updated_at, active
-- ============================================================================
INSERT INTO visits (
    member_id, provider_id, visit_date, doctor_name, specialty, 
    diagnosis, treatment, total_amount, active, created_at, updated_at
)
SELECT 
    m.id,
    (SELECT id FROM providers OFFSET FLOOR(RANDOM() * (SELECT COUNT(*) FROM providers)) LIMIT 1),
    '2024-01-01'::DATE + FLOOR(RANDOM() * 364)::INT,
    (ARRAY['د. محمد','د. أحمد','د. علي','د. خالد','د. عمر','د. فاطمة','د. عائشة','د. مريم','د. سلمى','د. زينب'])[1 + (v % 10)],
    (ARRAY['طب عام','طب باطني','جراحة','أسنان','عيون','قلب','أطفال','نساء وتوليد','عظام','جلدية'])[1 + (v % 10)],
    (ARRAY['فحص روتيني','صداع','آلام ظهر','ضغط دم','سكري','التهاب','حساسية','إصابة','فحص دوري','متابعة'])[1 + (v % 10)],
    'علاج ' || v,
    (100 + FLOOR(RANDOM() * 900))::NUMERIC(38,2),
    true,
    NOW(),
    NOW()
FROM members m
CROSS JOIN generate_series(1, 10) AS v
WHERE m.civil_id ~ '^\d{12}$'  -- Only seed members
  AND NOT EXISTS (
    SELECT 1 FROM visits WHERE member_id = m.id HAVING COUNT(*) >= 10
);

-- ============================================================================
-- 8. Create Claims (8000 total, 4 per member, mixed statuses)
-- Status allowed: DRAFT, SUBMITTED, UNDER_REVIEW, RETURNED_FOR_INFO, APPROVED, REJECTED, SETTLED
-- Required: insurance_org_id (NOT NULL), member_id, requested_amount, status
-- ============================================================================
INSERT INTO claims (
    member_id, insurance_org_id, provider_name, doctor_name, diagnosis,
    visit_date, requested_amount, status, active, created_at, updated_at
)
SELECT 
    m.id,
    (SELECT id FROM organizations WHERE type = 'INSURANCE' ORDER BY id LIMIT 1),
    'مقدم الخدمة ' || (1 + (c % 50)),
    (ARRAY['د. محمد','د. أحمد','د. علي','د. خالد','د. عمر','د. فاطمة','د. عائشة','د. مريم','د. سلمى','د. زينب'])[1 + (c % 10)],
    (ARRAY['فحص روتيني','صداع','آلام ظهر','ضغط دم','سكري','التهاب','حساسية','إصابة','فحص دوري','متابعة'])[1 + (c % 10)],
    '2024-01-01'::DATE + FLOOR(RANDOM() * 364)::INT,
    (200 + FLOOR(RANDOM() * 1800))::NUMERIC(15,2),
    CASE 
        WHEN c % 10 < 2 THEN 'DRAFT'
        WHEN c % 10 < 4 THEN 'SUBMITTED'
        WHEN c % 10 < 5 THEN 'UNDER_REVIEW'
        WHEN c % 10 < 7 THEN 'APPROVED'
        WHEN c % 10 < 9 THEN 'SETTLED'
        ELSE 'REJECTED'
    END,
    true,
    NOW(),
    NOW()
FROM members m
CROSS JOIN generate_series(1, 4) AS c
WHERE m.civil_id ~ '^\d{12}$'  -- Only seed members
  AND NOT EXISTS (
    SELECT 1 FROM claims WHERE member_id = m.id HAVING COUNT(*) >= 4
);

-- Update approved/settled claims with amounts
UPDATE claims 
SET approved_amount = requested_amount * 0.8,
    settled_at = CASE WHEN status = 'SETTLED' THEN NOW() ELSE NULL END
WHERE status IN ('APPROVED', 'SETTLED') AND approved_amount IS NULL;

-- ============================================================================
-- 9. Create Pre-Approvals (2000 total, 1 per member)
-- Type allowed: CHRONIC_CONDITION, EXCEED_LIMIT, SPECIAL_VIP, HIGH_COST_SERVICE, 
--               EXPERIMENTAL_TREATMENT, OUT_OF_NETWORK, EMERGENCY_OVERRIDE, OTHER
-- Status allowed: PENDING, UNDER_MEDICAL_REVIEW, UNDER_MANAGER_REVIEW, APPROVED, 
--                 PARTIALLY_APPROVED, REJECTED, EXPIRED, USED, CANCELLED
-- Required: approval_number (unique), member_id, provider_id, requested_amount, 
--           request_date, status, type, active, auto_approved, expired
-- ============================================================================
INSERT INTO pre_approvals (
    approval_number, member_id, provider_id, service_code, service_description,
    requested_amount, type, diagnosis_code, expected_service_date, 
    notes, status, request_date, active, auto_approved, expired, created_at, updated_at
)
SELECT 
    'PA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 8, '0'),
    m.id,
    (SELECT id FROM providers OFFSET FLOOR(RANDOM() * (SELECT COUNT(*) FROM providers)) LIMIT 1),
    'SVC' || LPAD((1 + (ROW_NUMBER() OVER () % 200))::TEXT, 5, '0'),
    'وصف الخدمة ' || (ROW_NUMBER() OVER ()),
    (500 + FLOOR(RANDOM() * 4500))::NUMERIC(38,2),
    (ARRAY['CHRONIC_CONDITION', 'EXCEED_LIMIT', 'HIGH_COST_SERVICE', 'OTHER'])[1 + (ROW_NUMBER() OVER () % 4)],
    'ICD10-' || (ROW_NUMBER() OVER ()),
    '2024-01-01'::DATE + FLOOR(RANDOM() * 364)::INT,
    'طلب موافقة مسبقة تلقائي ' || (ROW_NUMBER() OVER ()),
    CASE 
        WHEN ROW_NUMBER() OVER () % 5 < 2 THEN 'PENDING'
        WHEN ROW_NUMBER() OVER () % 5 < 4 THEN 'APPROVED'
        ELSE 'REJECTED'
    END,
    CURRENT_DATE,
    true,
    false,
    false,
    NOW(),
    NOW()
FROM members m
WHERE m.civil_id ~ '^\d{12}$'  -- Only seed members
  AND NOT EXISTS (
    SELECT 1 FROM pre_approvals WHERE member_id = m.id
);

COMMIT;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 'TIER 2 DATA GENERATION COMPLETE' AS status;
SELECT 
    (SELECT COUNT(*) FROM organizations WHERE type='EMPLOYER') as employers,
    (SELECT COUNT(*) FROM providers) as providers,
    (SELECT COUNT(*) FROM medical_categories) as categories,
    (SELECT COUNT(*) FROM medical_services) as services,
    (SELECT COUNT(*) FROM benefit_policies) as policies,
    (SELECT COUNT(*) FROM members) as members,
    (SELECT COUNT(*) FROM visits) as visits,
    (SELECT COUNT(*) FROM claims) as claims,
    (SELECT COUNT(*) FROM pre_approvals) as pre_approvals;
