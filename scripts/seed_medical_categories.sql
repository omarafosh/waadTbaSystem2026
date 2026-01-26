-- ═══════════════════════════════════════════════════════════════════════════
-- Medical Categories - Complete Reference List
-- TBA WAAD System
-- ═══════════════════════════════════════════════════════════════════════════
-- This file can be run directly to seed all medical categories
-- Run with: psql -U postgres -d tba_waad_system -f seed_medical_categories.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP (Optional - uncomment if you want to reset categories)
-- ═══════════════════════════════════════════════════════════════════════════
-- DELETE FROM medical_categories WHERE code LIKE 'SC%';
-- DELETE FROM medical_categories WHERE code LIKE 'MC%';

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: MAIN CATEGORIES (35 التصنيفات الرئيسية)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO medical_categories (code, name_ar, name_en, description, parent_id, sort_order, active, created_at, updated_at)
VALUES
    -- الإيواء والعلاج
    ('MC001', 'الإيواء والعلاج', 'Accommodation & Treatment', 'خدمات الإقامة والعلاج داخل المستشفى', NULL, 1, true, NOW(), NOW()),
    
    -- الدواء والمستلزمات الطبية
    ('MC002', 'الدواء والمستلزمات الطبية', 'Drugs & Medical Requirements', 'الأدوية والمستلزمات الطبية المختلفة', NULL, 2, true, NOW(), NOW()),
    
    -- العناية الفائقة وعناية القلب
    ('MC003', 'العناية الفائقة وعناية القلب', 'Intensive Care & CCU', 'وحدات العناية المركزة والقلب', NULL, 3, true, NOW(), NOW()),
    
    -- رسوم الأطباء والجراحيين
    ('MC004', 'رسوم الأطباء والجراحيين', 'Physicians & Surgeons Fees', 'رسوم الأطباء والجراحيين والمستشارين والتخدير', NULL, 4, true, NOW(), NOW()),
    
    -- الكشوفات التشخيصية
    ('MC005', 'الكشوفات التشخيصية', 'Diagnostic Examinations', 'الكشوفات التشخيصية للمريض داخل المستشفى', NULL, 5, true, NOW(), NOW()),
    
    -- العلاج والرعاية اليومية
    ('MC006', 'العلاج والرعاية اليومية', 'Daily Treatment & Care', 'خدمات العلاج والرعاية اليومية', NULL, 6, true, NOW(), NOW()),
    
    -- طوارئ الأسنان
    ('MC007', 'طوارئ الأسنان', 'Emergency Dental Care', 'علاج الأسنان بالطوارئ للمريض داخل المستشفى', NULL, 7, true, NOW(), NOW()),
    
    -- الإسعاف المحلي
    ('MC008', 'الإسعاف المحلي', 'Local Ambulance', 'خدمات الإسعاف والنقل الطبي المحلي', NULL, 8, true, NOW(), NOW()),
    
    -- التمريض المنزلي
    ('MC009', 'التمريض المنزلي والنقاهة', 'Home Nursing & Convalescence', 'التمريض في المنزل أو النقاهة بعد الخروج من المستشفى', NULL, 9, true, NOW(), NOW()),
    
    -- العلاج الطبيعي
    ('MC010', 'العلاج الطبيعي', 'Physiotherapy', 'خدمات العلاج الطبيعي والتأهيل', NULL, 10, true, NOW(), NOW()),
    
    -- إصابات العمل
    ('MC011', 'إصابات العمل', 'Work Injuries', 'تكاليف علاج إصابات العمل', NULL, 11, true, NOW(), NOW()),
    
    -- التصوير بالرنين والمقطعي
    ('MC012', 'التصوير بالرنين المغناطيسي والمقطعي', 'MRI, CT & PET Scans', 'التصوير بالرنين المغناطيسي والتصوير المقطعي والمسح الطبقي', NULL, 12, true, NOW(), NOW()),
    
    -- الأشعة والتحاليل
    ('MC013', 'التصوير بالأشعة والتحاليل', 'Pathology, Radiology & Diagnostic Tests', 'التصوير بالأشعة وتحليل العينات والفحوص التشخيصية', NULL, 13, true, NOW(), NOW()),
    
    -- زراعة الأعضاء
    ('MC014', 'زراعة الأعضاء', 'Organ Transplant', 'عمليات زراعة الأعضاء', NULL, 14, true, NOW(), NOW()),
    
    -- الطب النفسي
    ('MC015', 'الطب النفسي', 'Psychiatry', 'العلاج النفسي والأدوية والجلسات', NULL, 15, true, NOW(), NOW()),
    
    -- الجراحة للمريض خارج المستشفى
    ('MC016', 'جراحة للمريض خارج المستشفى', 'Outpatient Surgery', 'العمليات الجراحية للمرضى الخارجيين', NULL, 16, true, NOW(), NOW()),
    
    -- الأورام
    ('MC017', 'الأورام', 'Oncology', 'علاج الأورام والرعاية اليومية', NULL, 17, true, NOW(), NOW()),
    
    -- غسيل الكلى
    ('MC018', 'غسيل الكلى', 'Dialysis', 'خدمات غسيل الكلى', NULL, 18, true, NOW(), NOW()),
    
    -- الإخلاء الطبي
    ('MC019', 'الإخلاء الطبي', 'Medical Evacuation', 'خدمات الإخلاء الطبي والنقل', NULL, 19, true, NOW(), NOW()),
    
    -- تكلفة المرافق
    ('MC020', 'تكلفة المرافق', 'Companion Costs', 'تكلفة شخص مرافق للمريض المُخلى', NULL, 20, true, NOW(), NOW()),
    
    -- تكلفة سفر العائلة
    ('MC021', 'تكلفة سفر العائلة', 'Family Travel Costs', 'تكلفة السفر لأحد أفراد العائلة في حالة الإخلاء', NULL, 21, true, NOW(), NOW()),
    
    -- الولادة
    ('MC022', 'الولادة الطبيعية والقيصرية', 'Routine Maternity & Delivery', 'خدمات الولادة الطبيعية والقيصرية', NULL, 22, true, NOW(), NOW()),
    
    -- مضاعفات الحمل والولادة
    ('MC023', 'مضاعفات الحمل والولادة', 'Complications of Pregnancy & Delivery', 'علاج مضاعفات الحمل والولادة', NULL, 23, true, NOW(), NOW()),
    
    -- الأجهزة والمعدات الطبية
    ('MC024', 'الأجهزة والمعدات الطبية', 'Medical Equipment & Devices', 'الأجهزة والمعدات الطبية وفق تقرير الطبيب', NULL, 24, true, NOW(), NOW()),
    
    -- طب الأسنان
    ('MC025', 'طب الأسنان', 'Dental Care', 'علاج الأسنان الروتيني والتجميلي', NULL, 25, true, NOW(), NOW()),
    
    -- طب العيون
    ('MC026', 'طب العيون', 'Ophthalmology', 'كشوفات العيون والنظارات الطبية', NULL, 26, true, NOW(), NOW()),
    
    -- الجراحة العامة
    ('MC027', 'الجراحة العامة', 'General Surgery', 'العمليات الجراحية العامة', NULL, 27, true, NOW(), NOW()),
    
    -- جراحة العظام
    ('MC028', 'جراحة العظام', 'Orthopedic Surgery', 'عمليات العظام والمفاصل', NULL, 28, true, NOW(), NOW()),
    
    -- جراحة المخ والأعصاب
    ('MC029', 'جراحة المخ والأعصاب', 'Neurosurgery', 'عمليات جراحة المخ والأعصاب', NULL, 29, true, NOW(), NOW()),
    
    -- جراحة القلب والأوعية الدموية
    ('MC030', 'جراحة القلب والأوعية الدموية', 'Cardiovascular Surgery', 'عمليات القلب والأوعية الدموية والقسطرة', NULL, 30, true, NOW(), NOW()),
    
    -- جراحة المسالك البولية
    ('MC031', 'جراحة المسالك البولية', 'Urology Surgery', 'عمليات الكلى والمسالك البولية', NULL, 31, true, NOW(), NOW()),
    
    -- الأنف والأذن والحنجرة
    ('MC032', 'الأنف والأذن والحنجرة', 'ENT', 'جراحات وخدمات الأنف والأذن والحنجرة', NULL, 32, true, NOW(), NOW()),
    
    -- جراحة الأطفال
    ('MC033', 'جراحة الأطفال', 'Pediatric Surgery', 'عمليات جراحة الأطفال', NULL, 33, true, NOW(), NOW()),
    
    -- جراحة التجميل
    ('MC034', 'جراحة التجميل', 'Cosmetic Surgery', 'عمليات التجميل والترميم', NULL, 34, true, NOW(), NOW()),
    
    -- خدمات الطوارئ
    ('MC035', 'خدمات الطوارئ', 'Emergency Services', 'خدمات قسم الطوارئ والإسعاف', NULL, 35, true, NOW(), NOW())

ON CONFLICT (code) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: SUB-CATEGORIES (~120 التصنيفات الفرعية)
-- ═══════════════════════════════════════════════════════════════════════════

-- الإيواء والعلاج (MC001)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC001'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC001001', 'خدمات الإيواء', 'Accommodation Services', 1),
    ('SC001002', 'الخدمات بأقسام الإيواء والطوارئ', 'Inpatient & Emergency Services', 2),
    ('SC001003', 'الإقامة', 'Stay/Residence', 3),
    ('SC001004', 'الإشراف الطبي والكشوفات والإقامة', 'Medical Supervision & Stay', 4),
    ('SC001005', 'المتابعة الطبية', 'Medical Follow-up', 5),
    ('SC001006', 'خدمات فندقية', 'Hotel Services', 6),
    ('SC001007', 'مرافق', 'Companion', 7)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- الدواء والمستلزمات الطبية (MC002)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC002'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC002001', 'أدوية ومستلزمات', 'Drugs & Supplies', 1),
    ('SC002002', 'أدوية أمراض مزمنة', 'Chronic Disease Medications', 2),
    ('SC002003', 'قائمة أدوية قسم الإسعاف والطوارئ', 'Emergency Medications List', 3),
    ('SC002004', 'أكواد مستلزمات عيادة الجراحة العامة والغيارات الطبية', 'General Surgery Clinic Supplies', 4),
    ('SC002005', 'قائمة الغيارات داخل الأقسام الإيوائية', 'Inpatient Dressing List', 5),
    ('SC002006', 'الغيارات الطبية', 'Medical Dressings', 6)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- العناية الفائقة وعناية القلب (MC003)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC003'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC003001', 'خدمات التخدير والعناية', 'Anesthesia & Intensive Care Services', 1),
    ('SC003002', 'خدمات الرعاية بالعناية المركزة', 'ICU Care Services', 2),
    ('SC003003', 'التخدير', 'Anesthesia', 3),
    ('SC003004', 'تخدير وعناية فائقة', 'Anesthesia & Intensive Care', 4)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- رسوم الأطباء والجراحيين (MC004)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC004'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC004001', 'كشف استشاري', 'Consultant Examination', 1),
    ('SC004002', 'كشف أخصائي', 'Specialist Examination', 2),
    ('SC004003', 'كشف عام', 'General Examination', 3),
    ('SC004004', 'كشف واستشارة', 'Examination & Consultation', 4),
    ('SC004005', 'الكشف والاستشارات الطبية', 'Medical Examinations & Consultations', 5),
    ('SC004006', 'الكشف والمتابعة والإشراف الطبي', 'Examination, Follow-up & Medical Supervision', 6),
    ('SC004007', 'كشف بالطوارئ', 'Emergency Examination', 7)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- الكشوفات التشخيصية (MC005)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC005'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC005001', 'خدمات طبية', 'Medical Services', 1),
    ('SC005002', 'خدمات طبية أخرى', 'Other Medical Services', 2),
    ('SC005003', 'خدمات العيادات الخارجية', 'Outpatient Services', 3),
    ('SC005004', 'خدمات الرعاية الطبية', 'Medical Care Services', 4),
    ('SC005005', 'الأمراض الصدرية', 'Pulmonary Diseases', 5),
    ('SC005006', 'الباطنة', 'Internal Medicine', 6),
    ('SC005007', 'قائمة خدمات عيادة الصدرية', 'Pulmonary Clinic Services List', 7)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- العلاج الطبيعي (MC010)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC010'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC010001', 'العلاج الطبيعي', 'Physiotherapy', 1),
    ('SC010002', 'العلاج الطبيعي المقرر', 'Prescribed Physiotherapy', 2),
    ('SC010003', 'علاج طبيعي', 'Physical Therapy', 3),
    ('SC010004', 'خدمات العلاج الطبيعي', 'Physiotherapy Services', 4),
    ('SC010005', 'قائمة خدمات عيادة العلاج الطبيعي', 'Physiotherapy Clinic Services List', 5),
    ('SC010006', 'خدمات الألم', 'Pain Management Services', 6)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- التصوير بالرنين المغناطيسي والمقطعي (MC012)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC012'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC012001', 'الرنين المغناطيسي', 'MRI', 1),
    ('SC012002', 'التصوير المقطعي - CT-Scan', 'CT Scan', 2),
    ('SC012003', 'الأشعة المقطعية', 'CT Imaging', 3),
    ('SC012004', 'التصوير بالرنين المغناطيسي', 'MRI Imaging', 4),
    ('SC012005', 'عروض الرنين المغناطيسي', 'MRI Offers', 5),
    ('SC012006', 'عروض الأشعة المقطعية', 'CT Scan Offers', 6)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- التصوير بالأشعة والتحاليل (MC013)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC013'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC013001', 'تحاليل', 'Laboratory Tests', 1),
    ('SC013002', 'معامل', 'Laboratories', 2),
    ('SC013003', 'التحاليل الطبية', 'Medical Analysis', 3),
    ('SC013004', 'تحاليل الأنسجة', 'Tissue Analysis', 4),
    ('SC013005', 'التصوير بالأشعة', 'Radiology', 5),
    ('SC013006', 'التصوير بالأشعة الرقمية', 'Digital Radiology', 6),
    ('SC013007', 'الأشعة العادية والملونة - X-RAY', 'Plain & Contrast X-Ray', 7),
    ('SC013008', 'أشعة وصور طبية', 'Medical Imaging', 8),
    ('SC013009', 'اشعة', 'X-Ray', 9),
    ('SC013010', 'الأشعة السينية', 'X-Ray Imaging', 10),
    ('SC013011', 'رنين/أشعة', 'MRI/X-Ray', 11),
    ('SC013012', 'خدمات الموجات فوق الصوتية', 'Ultrasound Services', 12),
    ('SC013013', 'موجات فوق الصوتية', 'Ultrasound', 13),
    ('SC013014', 'أسعار صورة التلفزيون', 'Ultrasound Prices', 14),
    ('SC013015', 'عروض الأشعة ديجيتال X-RAY', 'Digital X-Ray Offers', 15),
    ('SC013016', 'ماموجرام', 'Mammogram', 16),
    ('SC013017', 'وسائل تشخيصية وخدمات مساندة', 'Diagnostic & Support Services', 17),
    ('SC013018', 'خدمات الصور التشخيصية', 'Diagnostic Imaging Services', 18)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- الأورام (MC017)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC017'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC017001', 'أورام', 'Oncology', 1),
    ('SC017002', 'خدمات العلاج الكيماوي', 'Chemotherapy Services', 2)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- غسيل الكلى (MC018)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC018'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC018001', 'خدمات غسيل الكلى', 'Dialysis Services', 1),
    ('SC018002', 'خدمات غسيل كلوي', 'Renal Dialysis Services', 2),
    ('SC018003', 'خدمات الكلى الصناعية والغسيل', 'Artificial Kidney & Dialysis Services', 3),
    ('SC018004', 'خدمات جلسات الغسيل', 'Dialysis Session Services', 4)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- الولادة (MC022)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC022'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC022001', 'ولادة', 'Delivery', 1),
    ('SC022002', 'جراحات النساء والولادة', 'Obstetrics & Gynecology Surgeries', 2),
    ('SC022003', 'النساء والتوليد', 'Obstetrics & Gynecology', 3),
    ('SC022004', 'خدمات النساء والولادة', 'Ob-Gyn Services', 4),
    ('SC022005', 'عمليات قسم النساء - عمليات الولادة', 'Ob-Gyn Department Operations', 5),
    ('SC022006', 'عمليات - نساء وولادة', 'Ob-Gyn Operations', 6),
    ('SC022007', 'النساء وولادة', 'Women & Delivery', 7),
    ('SC022008', 'قائمة خدمات عيادة النساء', 'Gynecology Clinic Services List', 8),
    ('SC022009', 'العقم والخصوبة', 'Infertility & Fertility', 9)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- الأجهزة والمعدات الطبية (MC024)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC024'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC024001', 'الأجهزة الطبية', 'Medical Devices', 1)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- طب الأسنان (MC025)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC025'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC025001', 'خدمات الأسنان', 'Dental Services', 1),
    ('SC025002', 'كشف وصورة', 'Examination & X-Ray', 2),
    ('SC025003', 'العلاج التحفظي (الحشو)', 'Conservative Treatment (Filling)', 3),
    ('SC025004', 'حشو العصب', 'Root Canal Treatment', 4),
    ('SC025005', 'علاج اللثة الجراحي', 'Surgical Periodontal Treatment', 5),
    ('SC025006', 'علاج اللثة غير الجراحي', 'Non-Surgical Periodontal Treatment', 6),
    ('SC025007', 'جراحة الفم والأسنان', 'Oral & Dental Surgery', 7),
    ('SC025008', 'جراحة الفم والأسنان تحت التخدير الموضعي', 'Oral Surgery Under Local Anesthesia', 8),
    ('SC025009', 'التركيبات الثابتة', 'Fixed Prosthetics', 9),
    ('SC025010', 'التركيبات المتحركة', 'Removable Prosthetics', 10),
    ('SC025011', 'التركيبات / زراعة', 'Prosthetics / Implants', 11),
    ('SC025012', 'علاج تقويم الأسنان', 'Orthodontic Treatment', 12),
    ('SC025013', 'خدمات تقويم الأسنان', 'Orthodontic Services', 13),
    ('SC025014', 'أطفال أسنان', 'Pediatric Dentistry', 14),
    ('SC025015', 'أمراض المفصل الفكي', 'TMJ Disorders', 15),
    ('SC025016', 'قائمة الخدمات المقدمة بقسم الأسنان', 'Dental Department Services List', 16),
    ('SC025017', 'جراحة الوجه والفكين', 'Maxillofacial Surgery', 17)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- طب العيون (MC026)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC026'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC026001', 'خدمات العيون', 'Eye Services', 1),
    ('SC026002', 'أمراض العيون', 'Eye Diseases', 2),
    ('SC026003', 'عمليات العيون', 'Eye Surgery', 3),
    ('SC026004', 'نظارات', 'Glasses', 4),
    ('SC026005', 'عيون', 'Ophthalmology', 5)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- الجراحة العامة (MC027)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC027'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC027001', 'الجراحات العامة', 'General Surgeries', 1),
    ('SC027002', 'الجراحة العامة', 'General Surgery', 2),
    ('SC027003', 'عمليات الجراحة العامة', 'General Surgery Operations', 3),
    ('SC027004', 'عمليات الجراحة العامة بالمناظير الجراحية', 'Laparoscopic General Surgery', 4),
    ('SC027005', 'العمليات الصغرى داخل العيادة', 'Minor Operations in Clinic', 5),
    ('SC027006', 'العمليات الصغرى داخل غرفة العمليات', 'Minor Operations in OR', 6),
    ('SC027007', 'العمليات الكبرى', 'Major Operations', 7),
    ('SC027008', 'عمليات متوسطة', 'Medium Operations', 8),
    ('SC027009', 'عمليات جراحية بسيطة بالعيادات الخارجية', 'Simple Outpatient Surgeries', 9),
    ('SC027010', 'قائمة خدمات عيادة الجراحة العامة', 'General Surgery Clinic Services List', 10),
    ('SC027011', 'عمليات - عام', 'General Operations', 11),
    ('SC027012', 'عمليات - خاصة', 'Special Operations', 12),
    ('SC027013', 'عمليات الجراحية', 'Surgical Operations', 13),
    ('SC027014', 'خدمات المناظير', 'Endoscopy Services', 14),
    ('SC027015', 'مناظير الجهاز الهضمي التشخيصية والعلاجية', 'GI Diagnostic & Therapeutic Endoscopy', 15),
    ('SC027016', 'عمليات المناظير', 'Endoscopic Operations', 16),
    ('SC027017', 'قائمة خدمات عيادة الجهاز الهضمي والمناظير', 'GI & Endoscopy Clinic Services List', 17),
    ('SC027018', 'الجهاز الهضمي والمناظير', 'GI & Endoscopy', 18),
    ('SC027019', 'جراحات الصدر', 'Thoracic Surgeries', 19),
    ('SC027020', 'جراحة الصدر', 'Thoracic Surgery', 20),
    ('SC027021', 'عمليات جراحة الصدر', 'Thoracic Surgery Operations', 21),
    ('SC027022', 'خدمات جراحة الصدر', 'Thoracic Surgery Services', 22),
    ('SC027023', 'خدمات الجراحة', 'Surgery Services', 23)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- جراحة العظام (MC028)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC028'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC028001', 'جراحة العظام', 'Orthopedic Surgery', 1),
    ('SC028002', 'عمليات العظام', 'Bone Operations', 2),
    ('SC028003', 'عمليات المفاصل', 'Joint Operations', 3),
    ('SC028004', 'عمليات العظام المفاصل الصناعية', 'Joint Replacement Surgery', 4),
    ('SC028005', 'عمليات الأنسجة الرخوة', 'Soft Tissue Operations', 5),
    ('SC028006', 'عمليات عظام الأطفال والتشوهات الخلقية', 'Pediatric Orthopedic & Congenital Deformities', 6),
    ('SC028007', 'عمليات جراحة العظام والمفاصل', 'Bone & Joint Surgery', 7),
    ('SC028008', 'عمليات جراحة العظام', 'Orthopedic Surgical Operations', 8),
    ('SC028009', 'عمليات جراحة اليد', 'Hand Surgery', 9),
    ('SC028010', 'عمليات اليد والجراحات الترميمية', 'Hand & Reconstructive Surgery', 10),
    ('SC028011', 'عمليات - عظام أطفال', 'Pediatric Orthopedic Operations', 11),
    ('SC028012', 'خدمات العظام', 'Orthopedic Services', 12),
    ('SC028013', 'خدمات الجبس', 'Casting Services', 13),
    ('SC028014', 'قائمة الجبس للأطفال', 'Pediatric Cast List', 14),
    ('SC028015', 'قائمة الجبس للكبار', 'Adult Cast List', 15),
    ('SC028016', 'عمليات - جراحة اليد', 'Hand Surgery Operations', 16)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- جراحة المخ والأعصاب (MC029)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC029'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC029001', 'جراحة المخ والأعصاب', 'Neurosurgery', 1),
    ('SC029002', 'عمليات جراحة المخ والأعصاب - تحت التخدير العام', 'Neurosurgery Under General Anesthesia', 2),
    ('SC029003', 'عمليات - مخ وأعصاب', 'Brain & Nerve Operations', 3),
    ('SC029004', 'خدمات تخطيط العصب', 'Nerve Mapping Services', 4)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- جراحة القلب والأوعية الدموية (MC030)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC030'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC030001', 'جراحة القلب', 'Cardiac Surgery', 1),
    ('SC030002', 'أمراض القلب', 'Cardiology', 2),
    ('SC030003', 'القسطرة القلبية', 'Cardiac Catheterization', 3),
    ('SC030004', 'أسعار عيادة القلب والإيكو', 'Cardiology & Echo Clinic Prices', 4),
    ('SC030005', 'عمليات القلب', 'Heart Operations', 5),
    ('SC030006', 'الأوعية الدموية', 'Vascular', 6),
    ('SC030007', 'جراحة الأوعية الدموية', 'Vascular Surgery', 7),
    ('SC030008', 'عمليات الأوعية الدموية', 'Vascular Operations', 8),
    ('SC030009', 'قسم جراحة الأوعية الدموية', 'Vascular Surgery Department', 9)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- جراحة المسالك البولية (MC031)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC031'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC031001', 'جراحات الكلى والمسالك', 'Kidney & Urological Surgeries', 1),
    ('SC031002', 'عمليات جراحة المسالك - تحت التخدير العام', 'Urology Surgery Under General Anesthesia', 2),
    ('SC031003', 'عمليات جراحة المسالك بالمناظير', 'Laparoscopic Urology Surgery', 3),
    ('SC031004', 'عمليات مسالك بولية وتناسلية', 'Urological & Genital Operations', 4),
    ('SC031005', 'عمليات الكلى والمسالك', 'Kidney & Urological Operations', 5),
    ('SC031006', 'جراحة المسالك والأمراض التناسلية', 'Urology & Genital Disease Surgery', 6)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- الأنف والأذن والحنجرة (MC032)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC032'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC032001', 'خدمات الأنف والأذن والحنجرة', 'ENT Services', 1),
    ('SC032002', 'خدمات الأذن والأنف والحنجرة', 'ENT Services', 2),
    ('SC032003', 'جراحات الأنف والأذن والحنجرة', 'ENT Surgeries', 3),
    ('SC032004', 'عمليات الأنف والأذن والحنجرة ENT', 'ENT Operations', 4),
    ('SC032005', 'عمليات أذن وأنف وحنجرة', 'Ear, Nose & Throat Operations', 5),
    ('SC032006', 'أنف وأذن وحنجرة', 'ENT', 6),
    ('SC032007', 'قائمة خدمات عيادة الأنف والأذن والحنجرة', 'ENT Clinic Services List', 7),
    ('SC032008', 'السمعيات', 'Audiology', 8)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- جراحة الأطفال (MC033)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC033'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC033001', 'جراحات الأطفال', 'Pediatric Surgeries', 1),
    ('SC033002', 'جراحة الأطفال', 'Pediatric Surgery', 2),
    ('SC033003', 'عمليات جراحة الأطفال', 'Pediatric Surgical Operations', 3),
    ('SC033004', 'عمليات - جراحة أطفال', 'Pediatric Surgery Operations', 4),
    ('SC033005', 'الأطفال', 'Pediatrics', 5),
    ('SC033006', 'الأطفال B', 'Pediatrics B', 6)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- جراحة التجميل (MC034)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC034'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC034001', 'جراحة التجميل', 'Cosmetic Surgery', 1),
    ('SC034002', 'عمليات جراحة التجميل', 'Cosmetic Surgery Operations', 2),
    ('SC034003', 'جراحات وخدمات التجميل والحروق', 'Cosmetic & Burns Services', 3),
    ('SC034004', 'عمليات - التجميل والترميم', 'Cosmetic & Reconstructive Operations', 4),
    ('SC034005', 'خدمات جراحة التجميل', 'Cosmetic Surgery Services', 5),
    ('SC034006', 'جلسات التجميل للشعر والبشرة', 'Hair & Skin Cosmetic Sessions', 6),
    ('SC034007', 'جلسات تجميل بالليزر IPL', 'IPL Laser Cosmetic Sessions', 7),
    ('SC034008', 'جلسات تجميل بالليزر CO2', 'CO2 Laser Cosmetic Sessions', 8),
    ('SC034009', 'غيارات داخل عيادة التجميل', 'Dressings in Cosmetic Clinic', 9),
    ('SC034010', 'قائمة خدمات عيادة الجلدية', 'Dermatology Clinic Services List', 10)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- خدمات الطوارئ (MC035)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
SELECT code, name_ar, name_en, (SELECT id FROM medical_categories WHERE code = 'MC035'), sort_order, true, NOW(), NOW()
FROM (VALUES
    ('SC035001', 'خدمات الطوارئ', 'Emergency Services', 1),
    ('SC035002', 'الإسعاف والطوارئ', 'Ambulance & Emergency', 2),
    ('SC035003', 'الطوارئ', 'Emergency', 3),
    ('SC035004', 'قائمة خدمات قسم الإسعاف السريع بالعيادات الخارجية', 'Outpatient Emergency Services List', 4)
) AS t(code, name_ar, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- تصنيف عام (غير ذلك)
INSERT INTO medical_categories (code, name_ar, name_en, parent_id, sort_order, active, created_at, updated_at)
VALUES ('SC000001', 'غير ذلك', 'Other', NULL, 999, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;


COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION REPORT
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    'Main Categories' as type,
    COUNT(*) as count 
FROM medical_categories 
WHERE parent_id IS NULL AND code LIKE 'MC%'
UNION ALL
SELECT 
    'Sub Categories' as type,
    COUNT(*) as count 
FROM medical_categories 
WHERE parent_id IS NOT NULL
UNION ALL
SELECT 
    'Total Categories' as type,
    COUNT(*) as count 
FROM medical_categories;

-- Show category hierarchy
SELECT 
    COALESCE(p.name_ar, '📁 ' || c.name_ar) as "التصنيف الرئيسي",
    CASE WHEN p.id IS NOT NULL THEN '  └── ' || c.name_ar ELSE '' END as "التصنيف الفرعي",
    c.code,
    c.name_en
FROM medical_categories c
LEFT JOIN medical_categories p ON c.parent_id = p.id
ORDER BY COALESCE(p.sort_order, c.sort_order), c.sort_order;
