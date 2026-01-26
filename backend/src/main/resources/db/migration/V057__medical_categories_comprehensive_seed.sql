-- ═══════════════════════════════════════════════════════════════════════════
-- V057: Comprehensive Medical Categories Seed Data
-- TBA WAAD System - Complete Medical Service Categories
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Seed all main and sub-categories for medical services
-- Total: ~35 Main Categories + ~120 Sub-categories
-- 
-- Table Schema: medical_categories
--   - id (BIGSERIAL)
--   - code (VARCHAR 50, UNIQUE, NOT NULL)
--   - name_ar (VARCHAR 200, NOT NULL) -- Arabic name
--   - name_en (VARCHAR 200) -- English name
--   - parent_id (BIGINT) -- NULL for root categories
--   - active (BOOLEAN, NOT NULL, DEFAULT true)
--   - created_at (TIMESTAMP)
--   - updated_at (TIMESTAMP)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: MAIN CATEGORIES (التصنيفات الرئيسية - 35 تصنيف)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
SELECT code, name_ar, name_en, NULL, true, NOW(), NOW()
FROM (VALUES
    ('MC001', 'الإيواء والعلاج', 'Accommodation & Treatment'),
    ('MC002', 'الدواء والمستلزمات الطبية', 'Drugs & Medical Requirements'),
    ('MC003', 'العناية الفائقة وعناية القلب', 'Intensive Care & CCU'),
    ('MC004', 'رسوم الأطباء والجراحيين', 'Physicians & Surgeons Fees'),
    ('MC005', 'الكشوفات التشخيصية', 'Diagnostic Examinations'),
    ('MC006', 'العلاج والرعاية اليومية', 'Daily Treatment & Care'),
    ('MC007', 'طوارئ الأسنان', 'Emergency Dental Care'),
    ('MC008', 'الإسعاف المحلي', 'Local Ambulance'),
    ('MC009', 'التمريض المنزلي والنقاهة', 'Home Nursing & Convalescence'),
    ('MC010', 'العلاج الطبيعي', 'Physiotherapy'),
    ('MC011', 'إصابات العمل', 'Work Injuries'),
    ('MC012', 'التصوير بالرنين المغناطيسي والمقطعي', 'MRI & CT Scans'),
    ('MC013', 'التصوير بالأشعة والتحاليل', 'Radiology & Lab Tests'),
    ('MC014', 'زراعة الأعضاء', 'Organ Transplant'),
    ('MC015', 'الطب النفسي', 'Psychiatry'),
    ('MC016', 'جراحة للمريض خارج المستشفى', 'Outpatient Surgery'),
    ('MC017', 'الأورام', 'Oncology'),
    ('MC018', 'غسيل الكلى', 'Dialysis'),
    ('MC019', 'الإخلاء الطبي', 'Medical Evacuation'),
    ('MC020', 'تكلفة المرافق', 'Companion Costs'),
    ('MC021', 'تكلفة سفر العائلة', 'Family Travel Costs'),
    ('MC022', 'الولادة الطبيعية والقيصرية', 'Maternity & Delivery'),
    ('MC023', 'مضاعفات الحمل والولادة', 'Pregnancy Complications'),
    ('MC024', 'الأجهزة والمعدات الطبية', 'Medical Equipment'),
    ('MC025', 'طب الأسنان', 'Dental Care'),
    ('MC026', 'طب العيون', 'Ophthalmology'),
    ('MC027', 'الجراحة العامة', 'General Surgery'),
    ('MC028', 'جراحة العظام', 'Orthopedic Surgery'),
    ('MC029', 'جراحة المخ والأعصاب', 'Neurosurgery'),
    ('MC030', 'جراحة القلب والأوعية الدموية', 'Cardiovascular Surgery'),
    ('MC031', 'جراحة المسالك البولية', 'Urology Surgery'),
    ('MC032', 'الأنف والأذن والحنجرة', 'ENT'),
    ('MC033', 'جراحة الأطفال', 'Pediatric Surgery'),
    ('MC034', 'جراحة التجميل', 'Cosmetic Surgery'),
    ('MC035', 'خدمات الطوارئ', 'Emergency Services')
) AS main_cat(code, name_ar, name_en)
WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = main_cat.code);


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: SUB-CATEGORIES (التصنيفات الفرعية)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_mc001 BIGINT; v_mc002 BIGINT; v_mc003 BIGINT; v_mc004 BIGINT; v_mc005 BIGINT;
    v_mc010 BIGINT; v_mc012 BIGINT; v_mc013 BIGINT; v_mc017 BIGINT; v_mc018 BIGINT;
    v_mc022 BIGINT; v_mc025 BIGINT; v_mc026 BIGINT; v_mc027 BIGINT; v_mc028 BIGINT;
    v_mc029 BIGINT; v_mc030 BIGINT; v_mc031 BIGINT; v_mc032 BIGINT; v_mc033 BIGINT;
    v_mc034 BIGINT; v_mc035 BIGINT;
BEGIN
    -- Get parent category IDs
    SELECT id INTO v_mc001 FROM medical_categories WHERE code = 'MC001';
    SELECT id INTO v_mc002 FROM medical_categories WHERE code = 'MC002';
    SELECT id INTO v_mc003 FROM medical_categories WHERE code = 'MC003';
    SELECT id INTO v_mc004 FROM medical_categories WHERE code = 'MC004';
    SELECT id INTO v_mc005 FROM medical_categories WHERE code = 'MC005';
    SELECT id INTO v_mc010 FROM medical_categories WHERE code = 'MC010';
    SELECT id INTO v_mc012 FROM medical_categories WHERE code = 'MC012';
    SELECT id INTO v_mc013 FROM medical_categories WHERE code = 'MC013';
    SELECT id INTO v_mc017 FROM medical_categories WHERE code = 'MC017';
    SELECT id INTO v_mc018 FROM medical_categories WHERE code = 'MC018';
    SELECT id INTO v_mc022 FROM medical_categories WHERE code = 'MC022';
    SELECT id INTO v_mc025 FROM medical_categories WHERE code = 'MC025';
    SELECT id INTO v_mc026 FROM medical_categories WHERE code = 'MC026';
    SELECT id INTO v_mc027 FROM medical_categories WHERE code = 'MC027';
    SELECT id INTO v_mc028 FROM medical_categories WHERE code = 'MC028';
    SELECT id INTO v_mc029 FROM medical_categories WHERE code = 'MC029';
    SELECT id INTO v_mc030 FROM medical_categories WHERE code = 'MC030';
    SELECT id INTO v_mc031 FROM medical_categories WHERE code = 'MC031';
    SELECT id INTO v_mc032 FROM medical_categories WHERE code = 'MC032';
    SELECT id INTO v_mc033 FROM medical_categories WHERE code = 'MC033';
    SELECT id INTO v_mc034 FROM medical_categories WHERE code = 'MC034';
    SELECT id INTO v_mc035 FROM medical_categories WHERE code = 'MC035';

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: الإيواء والعلاج (MC001)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc001, true, NOW(), NOW()
    FROM (VALUES
        ('SC001001', 'خدمات الإيواء', 'Accommodation Services'),
        ('SC001002', 'الخدمات بأقسام الإيواء والطوارئ', 'Inpatient & Emergency Services'),
        ('SC001003', 'الإقامة', 'Stay/Residence'),
        ('SC001004', 'الإشراف الطبي والكشوفات والإقامة', 'Medical Supervision & Stay'),
        ('SC001005', 'المتابعة الطبية', 'Medical Follow-up'),
        ('SC001006', 'خدمات فندقية', 'Hotel Services'),
        ('SC001007', 'مرافق', 'Companion')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: الدواء والمستلزمات الطبية (MC002)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc002, true, NOW(), NOW()
    FROM (VALUES
        ('SC002001', 'أدوية ومستلزمات', 'Drugs & Supplies'),
        ('SC002002', 'أدوية أمراض مزمنة', 'Chronic Disease Medications'),
        ('SC002003', 'قائمة أدوية قسم الإسعاف والطوارئ', 'Emergency Medications List'),
        ('SC002004', 'أكواد مستلزمات عيادة الجراحة العامة', 'General Surgery Clinic Supplies'),
        ('SC002005', 'الغيارات الطبية', 'Medical Dressings')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: العناية الفائقة (MC003)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc003, true, NOW(), NOW()
    FROM (VALUES
        ('SC003001', 'خدمات التخدير والعناية', 'Anesthesia & ICU Services'),
        ('SC003002', 'خدمات الرعاية بالعناية المركزة', 'ICU Care Services'),
        ('SC003003', 'التخدير', 'Anesthesia'),
        ('SC003004', 'تخدير وعناية فائقة', 'Anesthesia & Intensive Care')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: رسوم الأطباء (MC004)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc004, true, NOW(), NOW()
    FROM (VALUES
        ('SC004001', 'كشف استشاري', 'Consultant Examination'),
        ('SC004002', 'كشف أخصائي', 'Specialist Examination'),
        ('SC004003', 'كشف عام', 'General Examination'),
        ('SC004004', 'كشف واستشارة', 'Examination & Consultation'),
        ('SC004005', 'الكشف والاستشارات الطبية', 'Medical Consultations'),
        ('SC004006', 'كشف بالطوارئ', 'Emergency Examination')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: الكشوفات التشخيصية (MC005)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc005, true, NOW(), NOW()
    FROM (VALUES
        ('SC005001', 'خدمات طبية', 'Medical Services'),
        ('SC005002', 'خدمات طبية أخرى', 'Other Medical Services'),
        ('SC005003', 'خدمات العيادات الخارجية', 'Outpatient Services'),
        ('SC005004', 'الأمراض الصدرية', 'Pulmonary Diseases'),
        ('SC005005', 'الباطنة', 'Internal Medicine')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: العلاج الطبيعي (MC010)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc010, true, NOW(), NOW()
    FROM (VALUES
        ('SC010001', 'العلاج الطبيعي', 'Physiotherapy'),
        ('SC010002', 'العلاج الطبيعي المقرر', 'Prescribed Physiotherapy'),
        ('SC010003', 'خدمات العلاج الطبيعي', 'Physiotherapy Services'),
        ('SC010004', 'خدمات الألم', 'Pain Management Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: التصوير بالرنين (MC012)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc012, true, NOW(), NOW()
    FROM (VALUES
        ('SC012001', 'الرنين المغناطيسي', 'MRI'),
        ('SC012002', 'التصوير المقطعي CT-Scan', 'CT Scan'),
        ('SC012003', 'الأشعة المقطعية', 'CT Imaging'),
        ('SC012004', 'التصوير بالرنين المغناطيسي', 'MRI Imaging')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: التصوير بالأشعة والتحاليل (MC013)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc013, true, NOW(), NOW()
    FROM (VALUES
        ('SC013001', 'تحاليل', 'Laboratory Tests'),
        ('SC013002', 'معامل', 'Laboratories'),
        ('SC013003', 'التحاليل الطبية', 'Medical Analysis'),
        ('SC013004', 'تحاليل الأنسجة', 'Tissue Analysis'),
        ('SC013005', 'التصوير بالأشعة', 'Radiology'),
        ('SC013006', 'التصوير بالأشعة الرقمية', 'Digital Radiology'),
        ('SC013007', 'الأشعة العادية والملونة X-RAY', 'Plain & Contrast X-Ray'),
        ('SC013008', 'أشعة وصور طبية', 'Medical Imaging'),
        ('SC013009', 'الأشعة السينية', 'X-Ray Imaging'),
        ('SC013010', 'خدمات الموجات فوق الصوتية', 'Ultrasound Services'),
        ('SC013011', 'موجات فوق الصوتية', 'Ultrasound'),
        ('SC013012', 'ماموجرام', 'Mammogram'),
        ('SC013013', 'خدمات الصور التشخيصية', 'Diagnostic Imaging Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: الأورام (MC017)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc017, true, NOW(), NOW()
    FROM (VALUES
        ('SC017001', 'أورام', 'Oncology'),
        ('SC017002', 'خدمات العلاج الكيماوي', 'Chemotherapy Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: غسيل الكلى (MC018)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc018, true, NOW(), NOW()
    FROM (VALUES
        ('SC018001', 'خدمات غسيل الكلى', 'Dialysis Services'),
        ('SC018002', 'خدمات غسيل كلوي', 'Renal Dialysis Services'),
        ('SC018003', 'خدمات الكلى الصناعية والغسيل', 'Artificial Kidney & Dialysis')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: الولادة (MC022)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc022, true, NOW(), NOW()
    FROM (VALUES
        ('SC022001', 'ولادة', 'Delivery'),
        ('SC022002', 'جراحات النساء والولادة', 'Ob-Gyn Surgeries'),
        ('SC022003', 'النساء والتوليد', 'Obstetrics & Gynecology'),
        ('SC022004', 'خدمات النساء والولادة', 'Ob-Gyn Services'),
        ('SC022005', 'عمليات قسم النساء والولادة', 'Ob-Gyn Operations'),
        ('SC022006', 'العقم والخصوبة', 'Infertility & Fertility')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: طب الأسنان (MC025)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc025, true, NOW(), NOW()
    FROM (VALUES
        ('SC025001', 'خدمات الأسنان', 'Dental Services'),
        ('SC025002', 'كشف وصورة', 'Examination & X-Ray'),
        ('SC025003', 'العلاج التحفظي (الحشو)', 'Conservative Treatment (Filling)'),
        ('SC025004', 'حشو العصب', 'Root Canal Treatment'),
        ('SC025005', 'علاج اللثة الجراحي', 'Surgical Periodontal Treatment'),
        ('SC025006', 'علاج اللثة غير الجراحي', 'Non-Surgical Periodontal Treatment'),
        ('SC025007', 'جراحة الفم والأسنان', 'Oral & Dental Surgery'),
        ('SC025008', 'التركيبات الثابتة', 'Fixed Prosthetics'),
        ('SC025009', 'التركيبات المتحركة', 'Removable Prosthetics'),
        ('SC025010', 'التركيبات / زراعة', 'Prosthetics / Implants'),
        ('SC025011', 'علاج تقويم الأسنان', 'Orthodontic Treatment'),
        ('SC025012', 'أطفال أسنان', 'Pediatric Dentistry'),
        ('SC025013', 'جراحة الوجه والفكين', 'Maxillofacial Surgery')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: طب العيون (MC026)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc026, true, NOW(), NOW()
    FROM (VALUES
        ('SC026001', 'خدمات العيون', 'Eye Services'),
        ('SC026002', 'أمراض العيون', 'Eye Diseases'),
        ('SC026003', 'عمليات العيون', 'Eye Surgery'),
        ('SC026004', 'نظارات', 'Glasses'),
        ('SC026005', 'عيون', 'Ophthalmology')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: الجراحة العامة (MC027)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc027, true, NOW(), NOW()
    FROM (VALUES
        ('SC027001', 'الجراحات العامة', 'General Surgeries'),
        ('SC027002', 'الجراحة العامة', 'General Surgery'),
        ('SC027003', 'عمليات الجراحة العامة', 'General Surgery Operations'),
        ('SC027004', 'عمليات الجراحة العامة بالمناظير', 'Laparoscopic General Surgery'),
        ('SC027005', 'العمليات الصغرى داخل العيادة', 'Minor Operations in Clinic'),
        ('SC027006', 'العمليات الصغرى داخل غرفة العمليات', 'Minor Operations in OR'),
        ('SC027007', 'العمليات الكبرى', 'Major Operations'),
        ('SC027008', 'عمليات متوسطة', 'Medium Operations'),
        ('SC027009', 'خدمات المناظير', 'Endoscopy Services'),
        ('SC027010', 'مناظير الجهاز الهضمي', 'GI Endoscopy'),
        ('SC027011', 'عمليات المناظير', 'Endoscopic Operations'),
        ('SC027012', 'الجهاز الهضمي والمناظير', 'GI & Endoscopy'),
        ('SC027013', 'جراحات الصدر', 'Thoracic Surgeries'),
        ('SC027014', 'جراحة الصدر', 'Thoracic Surgery'),
        ('SC027015', 'خدمات الجراحة', 'Surgery Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: جراحة العظام (MC028)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc028, true, NOW(), NOW()
    FROM (VALUES
        ('SC028001', 'جراحة العظام', 'Orthopedic Surgery'),
        ('SC028002', 'عمليات العظام', 'Bone Operations'),
        ('SC028003', 'عمليات المفاصل', 'Joint Operations'),
        ('SC028004', 'عمليات العظام المفاصل الصناعية', 'Joint Replacement Surgery'),
        ('SC028005', 'عمليات الأنسجة الرخوة', 'Soft Tissue Operations'),
        ('SC028006', 'عمليات عظام الأطفال', 'Pediatric Orthopedic'),
        ('SC028007', 'عمليات جراحة العظام والمفاصل', 'Bone & Joint Surgery'),
        ('SC028008', 'عمليات جراحة اليد', 'Hand Surgery'),
        ('SC028009', 'خدمات العظام', 'Orthopedic Services'),
        ('SC028010', 'خدمات الجبس', 'Casting Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: جراحة المخ والأعصاب (MC029)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc029, true, NOW(), NOW()
    FROM (VALUES
        ('SC029001', 'جراحة المخ والأعصاب', 'Neurosurgery'),
        ('SC029002', 'عمليات جراحة المخ والأعصاب', 'Neurosurgery Operations'),
        ('SC029003', 'عمليات مخ وأعصاب', 'Brain & Nerve Operations'),
        ('SC029004', 'خدمات تخطيط العصب', 'Nerve Mapping Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: جراحة القلب (MC030)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc030, true, NOW(), NOW()
    FROM (VALUES
        ('SC030001', 'جراحة القلب', 'Cardiac Surgery'),
        ('SC030002', 'أمراض القلب', 'Cardiology'),
        ('SC030003', 'القسطرة القلبية', 'Cardiac Catheterization'),
        ('SC030004', 'عيادة القلب والإيكو', 'Cardiology & Echo Clinic'),
        ('SC030005', 'عمليات القلب', 'Heart Operations'),
        ('SC030006', 'الأوعية الدموية', 'Vascular'),
        ('SC030007', 'جراحة الأوعية الدموية', 'Vascular Surgery'),
        ('SC030008', 'عمليات الأوعية الدموية', 'Vascular Operations')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: جراحة المسالك البولية (MC031)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc031, true, NOW(), NOW()
    FROM (VALUES
        ('SC031001', 'جراحات الكلى والمسالك', 'Kidney & Urological Surgeries'),
        ('SC031002', 'عمليات جراحة المسالك', 'Urology Surgery Operations'),
        ('SC031003', 'عمليات جراحة المسالك بالمناظير', 'Laparoscopic Urology Surgery'),
        ('SC031004', 'عمليات مسالك بولية وتناسلية', 'Urological & Genital Operations'),
        ('SC031005', 'عمليات الكلى والمسالك', 'Kidney & Urological Operations')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: الأنف والأذن والحنجرة (MC032)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc032, true, NOW(), NOW()
    FROM (VALUES
        ('SC032001', 'خدمات الأنف والأذن والحنجرة', 'ENT Services'),
        ('SC032002', 'جراحات الأنف والأذن والحنجرة', 'ENT Surgeries'),
        ('SC032003', 'عمليات الأنف والأذن والحنجرة', 'ENT Operations'),
        ('SC032004', 'عمليات أذن وأنف وحنجرة', 'Ear, Nose & Throat Operations'),
        ('SC032005', 'أنف وأذن وحنجرة', 'ENT'),
        ('SC032006', 'السمعيات', 'Audiology')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: جراحة الأطفال (MC033)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc033, true, NOW(), NOW()
    FROM (VALUES
        ('SC033001', 'جراحات الأطفال', 'Pediatric Surgeries'),
        ('SC033002', 'جراحة الأطفال', 'Pediatric Surgery'),
        ('SC033003', 'عمليات جراحة الأطفال', 'Pediatric Surgical Operations'),
        ('SC033004', 'الأطفال', 'Pediatrics')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: جراحة التجميل (MC034)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc034, true, NOW(), NOW()
    FROM (VALUES
        ('SC034001', 'جراحة التجميل', 'Cosmetic Surgery'),
        ('SC034002', 'عمليات جراحة التجميل', 'Cosmetic Surgery Operations'),
        ('SC034003', 'جراحات وخدمات التجميل والحروق', 'Cosmetic & Burns Services'),
        ('SC034004', 'عمليات التجميل والترميم', 'Cosmetic & Reconstructive Operations'),
        ('SC034005', 'خدمات جراحة التجميل', 'Cosmetic Surgery Services'),
        ('SC034006', 'جلسات التجميل للشعر والبشرة', 'Hair & Skin Cosmetic Sessions'),
        ('SC034007', 'جلسات تجميل بالليزر', 'Laser Cosmetic Sessions'),
        ('SC034008', 'خدمات عيادة الجلدية', 'Dermatology Clinic Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

    -- ═══════════════════════════════════════════════════════════════════════
    -- SUB-CATEGORIES FOR: خدمات الطوارئ (MC035)
    -- ═══════════════════════════════════════════════════════════════════════
    INSERT INTO medical_categories (code, name_ar, name_en, parent_id, active, created_at, updated_at)
    SELECT code, name_ar, name_en, v_mc035, true, NOW(), NOW()
    FROM (VALUES
        ('SC035001', 'خدمات الطوارئ', 'Emergency Services'),
        ('SC035002', 'الإسعاف والطوارئ', 'Ambulance & Emergency'),
        ('SC035003', 'الطوارئ', 'Emergency'),
        ('SC035004', 'خدمات الإسعاف السريع', 'Quick Emergency Services')
    ) AS sub(code, name_ar, name_en)
    WHERE NOT EXISTS (SELECT 1 FROM medical_categories WHERE code = sub.code);

END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    main_count INTEGER;
    sub_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO main_count FROM medical_categories WHERE parent_id IS NULL AND code LIKE 'MC%';
    SELECT COUNT(*) INTO sub_count FROM medical_categories WHERE parent_id IS NOT NULL;
    SELECT COUNT(*) INTO total_count FROM medical_categories;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Medical Categories Seed Summary:';
    RAISE NOTICE '  Main Categories: %', main_count;
    RAISE NOTICE '  Sub Categories: %', sub_count;
    RAISE NOTICE '  Total Categories: %', total_count;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
