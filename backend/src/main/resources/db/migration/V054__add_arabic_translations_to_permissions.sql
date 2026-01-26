-- ═══════════════════════════════════════════════════════════════════════════════
-- V054: Add Arabic translations to permissions table
-- ═══════════════════════════════════════════════════════════════════════════════
-- Date: 2026-01-22
-- Description: 
--   Adds name_ar and description_ar columns to permissions table
--   and populates with Arabic translations for all existing permissions.
--   This enables Arabic-speaking users to understand and assign permissions.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add Arabic columns if they don't exist
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS description_ar VARCHAR(500);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CLAIMS - المطالبات
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'إنشاء مطالبة', description_ar = 'إنشاء مطالبات جديدة في النظام' WHERE name = 'CREATE_CLAIM' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض المطالبات', description_ar = 'عرض معلومات المطالبات' WHERE name = 'VIEW_CLAIMS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض حالة المطالبة', description_ar = 'عرض الحالة الحالية للمطالبات المقدمة' WHERE name = 'VIEW_CLAIM_STATUS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تحديث المطالبة', description_ar = 'تحديث معلومات المطالبة الموجودة' WHERE name = 'UPDATE_CLAIM' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة المطالبات', description_ar = 'إدارة كاملة للمطالبات (إنشاء، تحديث، حذف)' WHERE name = 'MANAGE_CLAIMS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'الموافقة على المطالبات', description_ar = 'الموافقة على المطالبات للدفع' WHERE name = 'APPROVE_CLAIMS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'رفض المطالبات', description_ar = 'رفض المطالبات مع ذكر الأسباب' WHERE name = 'REJECT_CLAIMS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تسوية المطالبات', description_ar = 'تسوية المطالبات المعتمدة للدفع' WHERE name = 'SETTLE_CLAIMS' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PRE-AUTHORIZATION - الموافقات المسبقة
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'إنشاء موافقة مسبقة', description_ar = 'إنشاء طلبات الموافقة المسبقة' WHERE name = 'CREATE_PRE_AUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض الموافقات المسبقة', description_ar = 'عرض طلبات الموافقة المسبقة' WHERE name = 'VIEW_PRE_AUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تحديث الموافقة المسبقة', description_ar = 'تحديث طلبات الموافقة المسبقة' WHERE name = 'UPDATE_PRE_AUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'حذف الموافقة المسبقة', description_ar = 'حذف طلبات الموافقة المسبقة' WHERE name = 'DELETE_PRE_AUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'الموافقة على الطلب المسبق', description_ar = 'الموافقة على طلبات الموافقة المسبقة' WHERE name = 'APPROVE_PRE_AUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'رفض الطلب المسبق', description_ar = 'رفض طلبات الموافقة المسبقة' WHERE name = 'REJECT_PRE_AUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إلغاء الطلب المسبق', description_ar = 'إلغاء طلبات الموافقة المسبقة' WHERE name = 'CANCEL_PRE_AUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة الموافقات المسبقة', description_ar = 'إدارة كاملة للموافقات المسبقة' WHERE name = 'MANAGE_PREAUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض معلومات الموافقات', description_ar = 'عرض معلومات الموافقات المسبقة' WHERE name = 'VIEW_PREAUTH' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إنشاء موافقة مسبقة', description_ar = 'إنشاء طلبات موافقة مسبقة جديدة' WHERE name = 'CREATE_PRE_APPROVAL' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'الموافقة على الطلبات المسبقة', description_ar = 'الموافقة على طلبات الموافقة المسبقة' WHERE name = 'APPROVE_PRE_APPROVAL' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض الطلبات المسبقة', description_ar = 'عرض طلبات الموافقة المسبقة' WHERE name = 'VIEW_PRE_APPROVAL' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MEMBERS - الأعضاء
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض الأعضاء', description_ar = 'عرض معلومات الأعضاء فقط' WHERE name = 'VIEW_MEMBERS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة الأعضاء', description_ar = 'إنشاء، تحديث، حذف، وعرض الأعضاء' WHERE name = 'MANAGE_MEMBERS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'استيراد الأعضاء', description_ar = 'استيراد بيانات الأعضاء من ملفات خارجية' WHERE name = 'members.import' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض سجلات الاستيراد', description_ar = 'عرض سجلات استيراد الأعضاء' WHERE name = 'members.import_logs' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VISITS - الزيارات
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض الزيارات', description_ar = 'عرض معلومات الزيارات الطبية' WHERE name = 'VIEW_VISITS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة الزيارات', description_ar = 'إدارة كاملة للزيارات الطبية' WHERE name = 'MANAGE_VISITS' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROVIDERS - مقدمي الخدمة
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض مقدمي الخدمة', description_ar = 'عرض معلومات مقدمي الخدمة الصحية' WHERE name = 'VIEW_PROVIDERS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة مقدمي الخدمة', description_ar = 'إدارة كاملة لمقدمي الخدمة الصحية' WHERE name = 'MANAGE_PROVIDERS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'موظف مقدم خدمة', description_ar = 'صلاحيات موظف مقدم الخدمة' WHERE name = 'PROVIDER_STAFF' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROVIDER CONTRACTS - عقود مقدمي الخدمة
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض عقود مقدمي الخدمة', description_ar = 'عرض معلومات وإحصائيات عقود مقدمي الخدمة' WHERE name = 'VIEW_PROVIDER_CONTRACTS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة عقود مقدمي الخدمة', description_ar = 'إدارة كاملة لعقود مقدمي الخدمة (إنشاء، تحديث، حذف، تسعير)' WHERE name = 'MANAGE_PROVIDER_CONTRACTS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إنشاء عقد مقدم خدمة', description_ar = 'إنشاء عقود جديدة لمقدمي الخدمة' WHERE name = 'provider_contracts.create' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تحديث عقد مقدم خدمة', description_ar = 'تحديث عقود مقدمي الخدمة الموجودة' WHERE name = 'provider_contracts.update' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'حذف عقد مقدم خدمة', description_ar = 'حذف عقود مقدمي الخدمة' WHERE name = 'provider_contracts.delete' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض عقد مقدم خدمة', description_ar = 'عرض تفاصيل عقود مقدمي الخدمة' WHERE name = 'provider_contracts.view' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تفعيل عقد مقدم خدمة', description_ar = 'تفعيل أو إلغاء تفعيل عقود مقدمي الخدمة' WHERE name = 'provider_contracts.activate' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة تسعير العقود', description_ar = 'إدارة أسعار الخدمات في عقود مقدمي الخدمة' WHERE name = 'provider_contracts.pricing.manage' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPANIES - الشركات
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض الشركات', description_ar = 'عرض معلومات الشركات' WHERE name = 'VIEW_COMPANIES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة الشركات', description_ar = 'إنشاء، تحديث، حذف، وعرض جميع الشركات في النظام' WHERE name = 'MANAGE_COMPANIES' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EMPLOYERS - أصحاب العمل
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض أصحاب العمل', description_ar = 'عرض معلومات أصحاب العمل' WHERE name = 'VIEW_EMPLOYERS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة أصحاب العمل', description_ar = 'إدارة كاملة لشركات أصحاب العمل' WHERE name = 'MANAGE_EMPLOYERS' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSURANCE - شركات التأمين
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض شركات التأمين', description_ar = 'عرض معلومات شركات التأمين' WHERE name = 'VIEW_INSURANCE' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة شركات التأمين', description_ar = 'إدارة كاملة لشركات التأمين' WHERE name = 'MANAGE_INSURANCE' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- REVIEWER - شركات المراجعة الطبية
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض شركات المراجعة', description_ar = 'عرض معلومات شركات المراجعة الطبية' WHERE name = 'VIEW_REVIEWER' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة شركات المراجعة', description_ar = 'إدارة كاملة لشركات المراجعة الطبية' WHERE name = 'MANAGE_REVIEWER' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'مراجع طبي', description_ar = 'صلاحيات المراجع الطبي' WHERE name = 'MEDICAL_REVIEWER' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MEDICAL SERVICES - الخدمات الطبية
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض الخدمات الطبية', description_ar = 'عرض قائمة الخدمات الطبية المتاحة' WHERE name = 'VIEW_MEDICAL_SERVICES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة الخدمات الطبية', description_ar = 'إنشاء، تحديث، وحذف الخدمات الطبية' WHERE name = 'MANAGE_MEDICAL_SERVICES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض التصنيفات الطبية', description_ar = 'عرض تصنيفات الخدمات الطبية' WHERE name = 'VIEW_MEDICAL_CATEGORIES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة التصنيفات الطبية', description_ar = 'إدارة تصنيفات الخدمات الطبية' WHERE name = 'MANAGE_MEDICAL_CATEGORIES' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MEDICAL PACKAGES - الباقات الطبية
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'قراءة الباقات الطبية', description_ar = 'عرض الباقات الطبية المتاحة' WHERE name = 'MEDICAL_PACKAGE_READ' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إنشاء باقة طبية', description_ar = 'إنشاء باقات طبية جديدة' WHERE name = 'MEDICAL_PACKAGE_CREATE' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تحديث الباقات الطبية', description_ar = 'تحديث الباقات الطبية الموجودة' WHERE name = 'MEDICAL_PACKAGE_UPDATE' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'حذف الباقات الطبية', description_ar = 'حذف الباقات الطبية' WHERE name = 'MEDICAL_PACKAGE_DELETE' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BENEFIT POLICIES - وثائق المنافع
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض وثائق المنافع', description_ar = 'عرض وثائق المنافع التأمينية' WHERE name = 'VIEW_POLICIES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة وثائق المنافع', description_ar = 'إدارة كاملة لوثائق المنافع التأمينية' WHERE name = 'MANAGE_POLICIES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض باقات المنافع', description_ar = 'عرض باقات المنافع التأمينية' WHERE name = 'VIEW_BENEFIT_PACKAGES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة باقات المنافع', description_ar = 'إدارة باقات المنافع التأمينية' WHERE name = 'MANAGE_BENEFIT_PACKAGES' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة سياسات المنافع', description_ar = 'إدارة سياسات وقواعد المنافع' WHERE name = 'MANAGE_BENEFIT_POLICIES' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ELIGIBILITY - الأهلية
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'فحص الأهلية', description_ar = 'التحقق من أهلية العضو للخدمات الطبية' WHERE name = 'eligibility.check' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض سجلات الأهلية', description_ar = 'عرض سجلات فحوصات الأهلية' WHERE name = 'eligibility.view_logs' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RBAC - الأدوار والصلاحيات
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'إدارة الأدوار والصلاحيات', description_ar = 'التحكم الكامل في الأدوار، الصلاحيات، وتعيينات المستخدمين' WHERE name = 'MANAGE_RBAC' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض الأدوار', description_ar = 'عرض الأدوار المتاحة في النظام' WHERE name = 'roles.view' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة الأدوار', description_ar = 'إنشاء، تحديث، وحذف الأدوار' WHERE name = 'roles.manage' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تعيين صلاحيات الأدوار', description_ar = 'تعيين الصلاحيات للأدوار المختلفة' WHERE name = 'roles.assign_permissions' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض الصلاحيات', description_ar = 'عرض قائمة الصلاحيات المتاحة' WHERE name = 'permissions.view' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة الصلاحيات', description_ar = 'إنشاء وتحديث الصلاحيات' WHERE name = 'permissions.manage' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- USERS - المستخدمين
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض المستخدمين', description_ar = 'عرض قائمة المستخدمين في النظام' WHERE name = 'users.view' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة المستخدمين', description_ar = 'إنشاء، تحديث، وحذف حسابات المستخدمين' WHERE name = 'users.manage' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'تعيين أدوار المستخدمين', description_ar = 'تعيين الأدوار للمستخدمين' WHERE name = 'users.assign_roles' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- REPORTS - التقارير
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'عرض التقارير', description_ar = 'عرض تقارير النظام والتحليلات' WHERE name = 'VIEW_REPORTS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'إدارة التقارير', description_ar = 'إنشاء، تخصيص، وإدارة قوالب التقارير' WHERE name = 'MANAGE_REPORTS' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEM SETTINGS - إعدادات النظام
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'إدارة إعدادات النظام', description_ar = 'تكوين إعدادات ومعاملات النظام العامة' WHERE name = 'MANAGE_SYSTEM_SETTINGS' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'عرض البيانات الأساسية', description_ar = 'عرض معلومات النظام الأساسية (للقراءة فقط)' WHERE name = 'VIEW_BASIC_DATA' AND name_ar IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TPA - إدارة المطالبات الخارجية
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE permissions SET name_ar = 'مدير TPA', description_ar = 'صلاحيات مدير إدارة المطالبات الخارجية' WHERE name = 'TPA_MANAGER' AND name_ar IS NULL;
UPDATE permissions SET name_ar = 'موظف TPA', description_ar = 'صلاحيات موظف إدارة المطالبات الخارجية' WHERE name = 'TPA_STAFF' AND name_ar IS NULL;
