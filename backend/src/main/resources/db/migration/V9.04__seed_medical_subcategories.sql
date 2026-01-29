-- ═══════════════════════════════════════════════════════════════════════════
-- V9.04: Seed Medical Sub-Categories
-- ═══════════════════════════════════════════════════════════════════════════

-- Ensure we insert subcategories linked to the main categories created in V9.01

-- 1. الإيواء والعلاج (MC001)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC001'), true, NOW(), NOW()
FROM (VALUES
    ('SC001001', 'خدمات الإيواء'),
    ('SC001002', 'الخدمات بأقسام الإيواء والطوارئ'),
    ('SC001003', 'الإقامة'),
    ('SC001004', 'الإشراف الطبي والكشوفات والإقامة'),
    ('SC001005', 'المتابعة الطبية'),
    ('SC001006', 'خدمات فندقية'),
    ('SC001007', 'مرافق')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 2. الدواء والمستلزمات الطبية (MC002)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC002'), true, NOW(), NOW()
FROM (VALUES
    ('SC002001', 'أدوية ومستلزمات'),
    ('SC002002', 'أدوية أمراض مزمنة'),
    ('SC002003', 'قائمة أدوية قسم الإسعاف والطوارئ'),
    ('SC002004', 'أكواد مستلزمات عيادة الجراحة العامة والغيارات الطبية'),
    ('SC002005', 'قائمة الغيارات داخل الأقسام الإيوائية'),
    ('SC002006', 'الغيارات الطبية')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 3. العناية الفائقة وعناية القلب (MC003)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC003'), true, NOW(), NOW()
FROM (VALUES
    ('SC003001', 'خدمات التخدير والعناية'),
    ('SC003002', 'خدمات الرعاية بالعناية المركزة'),
    ('SC003003', 'التخدير'),
    ('SC003004', 'تخدير وعناية فائقة')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 4. رسوم الأطباء والجراحيين (MC004)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC004'), true, NOW(), NOW()
FROM (VALUES
    ('SC004001', 'كشف استشاري'),
    ('SC004002', 'كشف أخصائي'),
    ('SC004003', 'كشف عام'),
    ('SC004004', 'كشف واستشارة'),
    ('SC004005', 'الكشف والاستشارات الطبية'),
    ('SC004006', 'الكشف والمتابعة والإشراف الطبي'),
    ('SC004007', 'كشف بالطوارئ')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 5. الكشوفات التشخيصية (MC005)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC005'), true, NOW(), NOW()
FROM (VALUES
    ('SC005001', 'خدمات طبية'),
    ('SC005002', 'خدمات طبية أخرى'),
    ('SC005003', 'خدمات العيادات الخارجية'),
    ('SC005004', 'خدمات الرعاية الطبية'),
    ('SC005005', 'الأمراض الصدرية'),
    ('SC005006', 'الباطنة'),
    ('SC005007', 'قائمة خدمات عيادة الصدرية')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 6. العلاج الطبيعي (MC010)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC010'), true, NOW(), NOW()
FROM (VALUES
    ('SC010001', 'العلاج الطبيعي'),
    ('SC010002', 'العلاج الطبيعي المقرر'),
    ('SC010003', 'علاج طبيعي'),
    ('SC010004', 'خدمات العلاج الطبيعي'),
    ('SC010005', 'قائمة خدمات عيادة العلاج الطبيعي'),
    ('SC010006', 'خدمات الألم')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 7. طب الأسنان (MC025)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC025'), true, NOW(), NOW()
FROM (VALUES
    ('SC025001', 'خدمات الأسنان'),
    ('SC025002', 'كشف وصورة'),
    ('SC025003', 'العلاج التحفظي (الحشو)'),
    ('SC025004', 'حشو العصب'),
    ('SC025005', 'علاج اللثة الجراحي'),
    ('SC025006', 'علاج اللثة غير الجراحي'),
    ('SC025007', 'جراحة الفم والأسنان'),
    ('SC025008', 'جراحة الفم والأسنان تحت التخدير الموضعي'),
    ('SC025009', 'التركيبات الثابتة'),
    ('SC025010', 'التركيبات المتحركة'),
    ('SC025011', 'التركيبات / زراعة'),
    ('SC025012', 'علاج تقويم الأسنان'),
    ('SC025013', 'خدمات تقويم الأسنان'),
    ('SC025014', 'أطفال أسنان'),
    ('SC025015', 'أمراض المفصل الفكي'),
    ('SC025016', 'قائمة الخدمات المقدمة بقسم الأسنان'),
    ('SC025017', 'جراحة الوجه والفكين')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 8. طب العيون (MC026)
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
SELECT code, name, (SELECT id FROM medical_categories WHERE code = 'MC026'), true, NOW(), NOW()
FROM (VALUES
    ('SC026001', 'خدمات العيون'),
    ('SC026002', 'أمراض العيون'),
    ('SC026003', 'عمليات العيون'),
    ('SC026004', 'نظارات'),
    ('SC026005', 'عيون')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- 9. تصنيف عام
INSERT INTO medical_categories (code, name, parent_id, active, created_at, updated_at)
VALUES ('SC000001', 'غير ذلك', NULL, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;
