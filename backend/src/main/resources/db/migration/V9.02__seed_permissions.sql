-- ═══════════════════════════════════════════════════════════════════════════
-- V9.02: Seed Permisisons and Roles
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ROLES
INSERT INTO roles (name, description, active, created_at, updated_at) VALUES
('SUPER_ADMIN', 'System Super Administrator', true, NOW(), NOW()),
('INSURANCE_ADMIN', 'Insurance Company Administrator', true, NOW(), NOW()),
('TPA_ADMIN', 'Third Party Administrator', true, NOW(), NOW()),
('EMPLOYER_ADMIN', 'Employer HR Administrator', true, NOW(), NOW()),
('PROVIDER_ADMIN', 'Healthcare Provider Administrator', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. PERMISSIONS (Basic Set)
-- Updated to match new schema: module instead of category, added Arabic fields
INSERT INTO permissions (name, module, description, name_ar, description_ar, created_at, updated_at) VALUES
('VIEW_DASHBOARD', 'DASHBOARD', 'Can view dashboard statistics', 'عرض لوحة المعلومات', 'صلاحية عرض الإحصائيات العامة للنظام', NOW(), NOW()),
('MANAGE_USERS', 'SECURITY', 'Can create and edit users', 'إدارة المستخدمين', 'صلاحية إضافة وتعديل حسابات المستخدمين', NOW(), NOW()),
('VIEW_MEMBERS', 'MEMBER', 'Can view member profiles', 'عرض الأعضاء', 'صلاحية الاطلاع على ملفات المؤمن عليهم', NOW(), NOW()),
('MANAGE_MEMBERS', 'MEMBER', 'Can create and edit members', 'إدارة الأعضاء', 'صلاحية إضافة وتعديل بيانات المؤمن عليهم', NOW(), NOW()),
('VIEW_CLAIMS', 'CLAIM', 'Can view claims', 'عرض المطالبات', 'صلاحية الاطلاع على المطالبات الطبية', NOW(), NOW()),
('MANAGE_CLAIMS', 'CLAIM', 'Can process claims', 'إدارة المطالبات', 'صلاحية معالجة واتخاذ القرار في المطالبات', NOW(), NOW()),
('VIEW_PROVIDERS', 'PROVIDER', 'Can view provider list', 'عرض مقدمي الخدمة', 'صلاحية استعراض قائمة المستشفيات والمصحات', NOW(), NOW()),
('MANAGE_PROVIDERS', 'PROVIDER', 'Can create and edit providers', 'إدارة مقدمي الخدمة', 'صلاحية إضافة وتعديل عقود مقدمي الخدمة', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
