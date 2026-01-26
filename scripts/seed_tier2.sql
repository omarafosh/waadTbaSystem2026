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
--   - 2000 Members
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

-- Get employer IDs for later use
DO $$
DECLARE
    emp_ids BIGINT[];
BEGIN
    SELECT ARRAY_AGG(id ORDER BY id) INTO emp_ids 
    FROM organizations 
    WHERE type = 'EMPLOYER' AND code IN ('LCC001', 'JUL002', 'LCA003', 'UNB004');
    
    RAISE NOTICE 'Employer IDs: %', emp_ids;
END $$;

-- ============================================================================
-- 2. Create Providers (50 total)
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
-- ============================================================================
INSERT INTO medical_categories (code, name_ar, name_en, description_ar, description_en, active, created_at, updated_at)
SELECT code, name_ar, name_en, 'وصف ' || name_ar, 'Description for ' || name_en, true, NOW(), NOW()
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
-- ============================================================================
INSERT INTO medical_services (code, name_ar, name_en, description_ar, description_en, category_id, price_lyd, cost_lyd, requires_approval, active, created_at, updated_at)
SELECT 
    'SVC' || LPAD(((cat.row_num - 1) * 10 + svc.i)::TEXT, 5, '0'),
    'خدمة ' || cat.name_ar || ' ' || svc.i,
    cat.name_en || ' Service ' || svc.i,
    'وصف الخدمة ' || svc.i,
    'Service description ' || svc.i,
    cat.id,
    (50 + (RANDOM() * 950)::INT)::NUMERIC(10,2),
    (35 + (RANDOM() * 600)::INT)::NUMERIC(10,2),
    (RANDOM() < 0.3),
    true,
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
INSERT INTO benefit_policies (name, policy_code, description, employer_org_id, start_date, end_date, annual_limit, default_coverage_percent, per_member_limit, per_family_limit, notes, status, created_at, updated_at)
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
    NOW(),
    NOW()
FROM organizations emp
CROSS JOIN (VALUES
    ('Gold', 'GOLD', 50000.00, 90),
    ('Silver', 'SILVER', 25000.00, 70)
) AS tier(tier_name, tier_code, annual_limit, coverage)
WHERE emp.type = 'EMPLOYER' 
  AND emp.code IN ('LCC001', 'JUL002', 'LCA003', 'UNB004')
  AND NOT EXISTS (
    SELECT 1 FROM benefit_policies WHERE policy_code = emp.code || '-' || tier.tier_code
  );

-- ============================================================================
-- 6. Create Members (50000 total, 10000 per employer)
-- ============================================================================
DO $$
DECLARE
    emp RECORD;
    pol_id BIGINT;
    emp_count INT := 0;
BEGIN
    FOR emp IN 
        SELECT id, name, code 
        FROM organizations 
        WHERE type = 'EMPLOYER' AND code IN ('LCC001', 'JUL002', 'LCA003', 'UNB004')
        ORDER BY id
    LOOP
        emp_count := emp_count + 1;
        
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
            birth_date, gender, employer_id, benefit_policy_id, 
            phone, email, active, created_at, updated_at
        )
        SELECT 
            (ARRAY['محمد','أحمد','علي','عمر','خالد','فاطمة','عائشة','مريم','زينب','سلمى'])[1 + (i % 10)] 
                || ' ' 
                || (ARRAY['العربي','الليبي','التونسي','الجزائري','المصري','السوداني','المغربي','الموريتاني','العراقي','الأردني'])[1 + ((i/10) % 10)]
                || ' ' || ((emp_count - 1) * 500 + i),
            'Member ' || ((emp_count - 1) * 500 + i),
            LPAD(((emp_count - 1) * 500 + i)::TEXT, 12, '0'),
            'CARD' || LPAD(((emp_count - 1) * 500 + i)::TEXT, 8, '0'),
            ('1960-01-01'::DATE + (RANDOM() * 14600)::INT),
            CASE WHEN i % 2 = 0 THEN 'MALE' ELSE 'FEMALE' END,
            emp.id,
            pol_id,
            '+21892' || LPAD(((emp_count - 1) * 500 + i)::TEXT, 7, '0'),
            'member' || ((emp_count - 1) * 500 + i) || '@test.ly',
            true,
            NOW(),
            NOW()
        FROM generate_series(1, 500) AS i
        WHERE NOT EXISTS (
            SELECT 1 FROM members 
            WHERE civil_id = LPAD(((emp_count - 1) * 500 + i)::TEXT, 12, '0')
        );
        
        RAISE NOTICE 'Created members for employer %: %', emp.name, emp.code;
    END LOOP;
END $$;

-- ============================================================================
-- 7. Create Visits (20000 total, 10 per member)
-- ============================================================================
INSERT INTO visits (
    member_id, provider_id, visit_date, doctor_name, specialty, 
    diagnosis, treatment, total_amount, created_at, updated_at
)
SELECT 
    m.id,
    (SELECT id FROM providers ORDER BY RANDOM() LIMIT 1),
    '2024-01-01'::DATE + (RANDOM() * 364)::INT,
    (ARRAY['د. محمد','د. أحمد','د. علي','د. خالد','د. عمر','د. فاطمة','د. عائشة','د. مريم','د. سلمى','د. زينب'])[1 + (v % 10)],
    (ARRAY['طب عام','طب باطني','جراحة','أسنان','عيون','قلب','أطفال','نساء وتوليد','عظام','جلدية'])[1 + (v % 10)],
    (ARRAY['فحص روتيني','صداع','آلام ظهر','ضغط دم','سكري','التهاب','حساسية','إصابة','فحص دوري','متابعة'])[1 + (v % 10)],
    'علاج ' || (ROW_NUMBER() OVER ()),
    (100 + (RANDOM() * 900)::INT)::NUMERIC(10,2),
    NOW(),
    NOW()
FROM members m
CROSS JOIN generate_series(1, 10) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM visits WHERE member_id = m.id LIMIT 10
);

-- ============================================================================
-- 8. Create Claims (8000 total, 4 per member, mixed statuses)
-- ============================================================================
INSERT INTO claims (
    claim_number, member_id, provider_name, doctor_name, diagnosis,
    visit_date, requested_amount, status, created_at, updated_at
)
SELECT 
    'CLM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 8, '0'),
    m.id,
    'مقدم الخدمة ' || (1 + (c % 50)),
    (ARRAY['د. محمد','د. أحمد','د. علي','د. خالد','د. عمر','د. فاطمة','د. عائشة','د. مريم','د. سلمى','د. زينب'])[1 + (c % 10)],
    (ARRAY['فحص روتيني','صداع','آلام ظهر','ضغط دم','سكري','التهاب','حساسية','إصابة','فحص دوري','متابعة'])[1 + (c % 10)],
    '2024-01-01'::DATE + (RANDOM() * 364)::INT,
    (200 + (RANDOM() * 1800)::INT)::NUMERIC(10,2),
    CASE 
        WHEN c % 10 < 2 THEN 'DRAFT'
        WHEN c % 10 < 4 THEN 'SUBMITTED'
        WHEN c % 10 < 5 THEN 'IN_REVIEW'
        WHEN c % 10 < 7 THEN 'APPROVED'
        WHEN c % 10 < 9 THEN 'SETTLED'
        ELSE 'REJECTED'
    END,
    NOW(),
    NOW()
FROM members m
CROSS JOIN generate_series(1, 4) AS c
WHERE NOT EXISTS (
    SELECT 1 FROM claims WHERE member_id = m.id LIMIT 4
);

-- Update approved/settled claims with amounts
UPDATE claims 
SET approved_amount = requested_amount * 0.8,
    settlement_amount = CASE WHEN status = 'SETTLED' THEN requested_amount * 0.8 ELSE NULL END,
    approved_at = CASE WHEN status IN ('APPROVED', 'SETTLED') THEN NOW() ELSE NULL END,
    settled_at = CASE WHEN status = 'SETTLED' THEN NOW() ELSE NULL END
WHERE status IN ('APPROVED', 'SETTLED') AND approved_amount IS NULL;

-- ============================================================================
-- 9. Create Pre-Approvals (2000 total, 1 per member)
-- ============================================================================
INSERT INTO pre_approvals (
    reference_number, member_id, provider_id, service_code, service_description,
    requested_amount, type, diagnosis_code, expected_service_date, 
    notes, status, created_at, updated_at
)
SELECT 
    'PA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 8, '0'),
    m.id,
    (SELECT id FROM providers ORDER BY RANDOM() LIMIT 1),
    'SVC' || LPAD((1 + (ROW_NUMBER() OVER () % 200))::TEXT, 5, '0'),
    'وصف الخدمة ' || (ROW_NUMBER() OVER ()),
    (500 + (RANDOM() * 4500)::INT)::NUMERIC(10,2),
    (ARRAY['INPATIENT', 'OUTPATIENT', 'SURGERY', 'DIAGNOSTIC'])[1 + (ROW_NUMBER() OVER () % 4)],
    'ICD10-' || (ROW_NUMBER() OVER ()),
    '2024-01-01'::DATE + (RANDOM() * 364)::INT,
    'طلب موافقة مسبقة تلقائي ' || (ROW_NUMBER() OVER ()),
    CASE 
        WHEN ROW_NUMBER() OVER () % 5 < 2 THEN 'PENDING'
        WHEN ROW_NUMBER() OVER () % 5 < 4 THEN 'APPROVED'
        ELSE 'REJECTED'
    END,
    NOW(),
    NOW()
FROM members m
WHERE NOT EXISTS (
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
