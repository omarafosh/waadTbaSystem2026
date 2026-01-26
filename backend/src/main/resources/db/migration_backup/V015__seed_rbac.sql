-- ═══════════════════════════════════════════════════════════════════════════
-- V015: Seed Roles and Permissions - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Seed initial RBAC data (roles, permissions, role_permissions)
-- Dependencies: V001 (roles, permissions)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- SEED ROLES
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO roles (name, name_ar, description, is_system_role, active) VALUES
('SUPER_ADMIN', 'المدير العام', 'Full system access - TPA level', TRUE, TRUE),
('EMPLOYER_ADMIN', 'مدير جهة العمل', 'Employer organization administrator', TRUE, TRUE),
('HR_MANAGER', 'مدير الموارد البشرية', 'HR management for employer', TRUE, TRUE),
('PROVIDER_ADMIN', 'مدير مقدم الخدمة', 'Healthcare provider administrator', TRUE, TRUE),
('CLAIMS_OFFICER', 'موظف المطالبات', 'Claims processing officer', TRUE, TRUE),
('MEMBER_VIEWER', 'عارض الأعضاء', 'Read-only member information access', TRUE, TRUE);

-- ───────────────────────────────────────────────────────────────────────────
-- SEED PERMISSIONS BY MODULE
-- ───────────────────────────────────────────────────────────────────────────

-- Member Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('MEMBER_VIEW', 'View Members', 'عرض الأعضاء', 'MEMBER', TRUE),
('MEMBER_CREATE', 'Create Members', 'إنشاء أعضاء', 'MEMBER', TRUE),
('MEMBER_UPDATE', 'Update Members', 'تحديث الأعضاء', 'MEMBER', TRUE),
('MEMBER_DELETE', 'Delete Members', 'حذف الأعضاء', 'MEMBER', TRUE),
('MEMBER_IMPORT', 'Import Members', 'استيراد الأعضاء', 'MEMBER', TRUE),
('MEMBER_EXPORT', 'Export Members', 'تصدير الأعضاء', 'MEMBER', TRUE);

-- Employer Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('EMPLOYER_VIEW', 'View Employers', 'عرض جهات العمل', 'EMPLOYER', TRUE),
('EMPLOYER_CREATE', 'Create Employers', 'إنشاء جهات عمل', 'EMPLOYER', TRUE),
('EMPLOYER_UPDATE', 'Update Employers', 'تحديث جهات العمل', 'EMPLOYER', TRUE),
('EMPLOYER_DELETE', 'Delete Employers', 'حذف جهات العمل', 'EMPLOYER', TRUE);

-- Benefit Policy Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('BENEFIT_POLICY_VIEW', 'View Benefit Policies', 'عرض سياسات المزايا', 'BENEFIT_POLICY', TRUE),
('BENEFIT_POLICY_CREATE', 'Create Benefit Policies', 'إنشاء سياسات المزايا', 'BENEFIT_POLICY', TRUE),
('BENEFIT_POLICY_UPDATE', 'Update Benefit Policies', 'تحديث سياسات المزايا', 'BENEFIT_POLICY', TRUE),
('BENEFIT_POLICY_DELETE', 'Delete Benefit Policies', 'حذف سياسات المزايا', 'BENEFIT_POLICY', TRUE);

-- Provider Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('PROVIDER_VIEW', 'View Providers', 'عرض مقدمي الخدمات', 'PROVIDER', TRUE),
('PROVIDER_CREATE', 'Create Providers', 'إنشاء مقدمي خدمات', 'PROVIDER', TRUE),
('PROVIDER_UPDATE', 'Update Providers', 'تحديث مقدمي الخدمات', 'PROVIDER', TRUE),
('PROVIDER_DELETE', 'Delete Providers', 'حذف مقدمي الخدمات', 'PROVIDER', TRUE);

-- Claims Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('CLAIM_VIEW', 'View Claims', 'عرض المطالبات', 'CLAIM', TRUE),
('CLAIM_CREATE', 'Create Claims', 'إنشاء مطالبات', 'CLAIM', TRUE),
('CLAIM_UPDATE', 'Update Claims', 'تحديث المطالبات', 'CLAIM', TRUE),
('CLAIM_APPROVE', 'Approve Claims', 'الموافقة على المطالبات', 'CLAIM', TRUE),
('CLAIM_REJECT', 'Reject Claims', 'رفض المطالبات', 'CLAIM', TRUE);

-- Pre-Approval Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('PREAPPROVAL_VIEW', 'View Pre-Approvals', 'عرض الموافقات المسبقة', 'PREAPPROVAL', TRUE),
('PREAPPROVAL_CREATE', 'Create Pre-Approvals', 'إنشاء موافقات مسبقة', 'PREAPPROVAL', TRUE),
('PREAPPROVAL_UPDATE', 'Update Pre-Approvals', 'تحديث الموافقات المسبقة', 'PREAPPROVAL', TRUE),
('PREAPPROVAL_APPROVE', 'Approve Pre-Approvals', 'الموافقة على الطلبات', 'PREAPPROVAL', TRUE);

-- Eligibility Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('ELIGIBILITY_CHECK', 'Check Eligibility', 'التحقق من الأهلية', 'ELIGIBILITY', TRUE),
('ELIGIBILITY_VIEW_HISTORY', 'View Eligibility History', 'عرض سجل الأهلية', 'ELIGIBILITY', TRUE);

-- System Admin Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('USER_VIEW', 'View Users', 'عرض المستخدمين', 'SYSTEM', TRUE),
('USER_CREATE', 'Create Users', 'إنشاء مستخدمين', 'SYSTEM', TRUE),
('USER_UPDATE', 'Update Users', 'تحديث المستخدمين', 'SYSTEM', TRUE),
('USER_DELETE', 'Delete Users', 'حذف المستخدمين', 'SYSTEM', TRUE),
('ROLE_MANAGE', 'Manage Roles', 'إدارة الأدوار', 'SYSTEM', TRUE),
('AUDIT_VIEW', 'View Audit Logs', 'عرض سجلات التدقيق', 'SYSTEM', TRUE),
('CONFIG_MANAGE', 'Manage Configuration', 'إدارة الإعدادات', 'SYSTEM', TRUE);

-- Reports Module
INSERT INTO permissions (code, name, name_ar, module, active) VALUES
('REPORT_VIEW', 'View Reports', 'عرض التقارير', 'REPORT', TRUE),
('REPORT_EXPORT', 'Export Reports', 'تصدير التقارير', 'REPORT', TRUE),
('DASHBOARD_VIEW', 'View Dashboard', 'عرض لوحة التحكم', 'REPORT', TRUE);

-- ───────────────────────────────────────────────────────────────────────────
-- ASSIGN PERMISSIONS TO ROLES
-- ───────────────────────────────────────────────────────────────────────────

-- SUPER_ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'SUPER_ADMIN';

-- EMPLOYER_ADMIN: Employer-scoped permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'EMPLOYER_ADMIN' 
AND p.code IN (
    'MEMBER_VIEW', 'MEMBER_CREATE', 'MEMBER_UPDATE', 'MEMBER_IMPORT', 'MEMBER_EXPORT',
    'EMPLOYER_VIEW', 'EMPLOYER_UPDATE',
    'BENEFIT_POLICY_VIEW',
    'CLAIM_VIEW', 'CLAIM_CREATE',
    'PREAPPROVAL_VIEW', 'PREAPPROVAL_CREATE',
    'ELIGIBILITY_CHECK', 'ELIGIBILITY_VIEW_HISTORY',
    'USER_VIEW', 'USER_CREATE', 'USER_UPDATE',
    'REPORT_VIEW', 'DASHBOARD_VIEW'
);

-- HR_MANAGER: HR-focused permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'HR_MANAGER' 
AND p.code IN (
    'MEMBER_VIEW', 'MEMBER_CREATE', 'MEMBER_UPDATE', 'MEMBER_IMPORT', 'MEMBER_EXPORT',
    'EMPLOYER_VIEW',
    'BENEFIT_POLICY_VIEW',
    'ELIGIBILITY_CHECK', 'ELIGIBILITY_VIEW_HISTORY',
    'REPORT_VIEW', 'DASHBOARD_VIEW'
);

-- PROVIDER_ADMIN: Provider-scoped permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'PROVIDER_ADMIN' 
AND p.code IN (
    'MEMBER_VIEW',
    'PROVIDER_VIEW', 'PROVIDER_UPDATE',
    'CLAIM_VIEW', 'CLAIM_CREATE', 'CLAIM_UPDATE',
    'PREAPPROVAL_VIEW', 'PREAPPROVAL_CREATE', 'PREAPPROVAL_UPDATE',
    'ELIGIBILITY_CHECK',
    'REPORT_VIEW', 'DASHBOARD_VIEW'
);

-- CLAIMS_OFFICER: Claims-focused permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'CLAIMS_OFFICER' 
AND p.code IN (
    'MEMBER_VIEW',
    'CLAIM_VIEW', 'CLAIM_CREATE', 'CLAIM_UPDATE', 'CLAIM_APPROVE', 'CLAIM_REJECT',
    'PREAPPROVAL_VIEW', 'PREAPPROVAL_UPDATE', 'PREAPPROVAL_APPROVE',
    'ELIGIBILITY_CHECK', 'ELIGIBILITY_VIEW_HISTORY',
    'REPORT_VIEW', 'DASHBOARD_VIEW'
);

-- MEMBER_VIEWER: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'MEMBER_VIEWER' 
AND p.code IN (
    'MEMBER_VIEW',
    'ELIGIBILITY_CHECK',
    'DASHBOARD_VIEW'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V015
-- ═══════════════════════════════════════════════════════════════════════════
