-- ═══════════════════════════════════════════════════════════════════════════
-- V1.01: Security Tables (RBAC)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ROLES
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. USERS
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    profile_image_url VARCHAR(255),
    
    active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Validation
    email_verified BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMP,
    
    -- Security
    failed_login_count INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP,
    
    -- Organization Context
    company_id BIGINT,
    employer_id BIGINT,
    provider_id BIGINT,
    
    -- Access Flags (Restored)
    allow_all_companies BOOLEAN DEFAULT FALSE,
    can_view_members BOOLEAN DEFAULT TRUE,
    can_view_benefit_policies BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 3. PERMISSIONS
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_ar VARCHAR(100),
    description VARCHAR(500),
    description_ar VARCHAR(500),
    module VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 4. USER_ROLES (Many-to-Many)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 5. ROLE_PERMISSIONS (Many-to-Many)
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 6. USER_PERMITTED_ORGANIZATIONS (Moved to V1.02)
-- Table definition moved to V1.02 to ensure 'organizations' table exists first.

-- 7. SEED DATA (Consolidated FGAC Permissions)
DELETE FROM role_permissions;
DELETE FROM user_roles;
DELETE FROM roles;
DELETE FROM permissions;

-- Seed All Permissions
INSERT INTO permissions (name, name_ar, module, active, created_at) VALUES
-- Claims
('CLAIM_VIEW', 'عرض المطالبات', 'CLAIMS', true, NOW()),
('CLAIM_CREATE', 'إضافة مطالبة', 'CLAIMS', true, NOW()),
('CLAIM_EDIT', 'تعديل مطالبة', 'CLAIMS', true, NOW()),
('CLAIM_DELETE', 'حذف مطالبة', 'CLAIMS', true, NOW()),
('CLAIM_EXPORT', 'تصدير المطالبات', 'CLAIMS', true, NOW()),
('CLAIM_IMPORT', 'استيراد المطالبات', 'CLAIMS', true, NOW()),
('CLAIM_REPORTS', 'تقارير المطالبات', 'CLAIMS', true, NOW()),

-- Providers
('PROVIDER_VIEW', 'عرض مقدمي الخدمة', 'PROVIDERS', true, NOW()),
('PROVIDER_CREATE', 'إضافة مقدم خدمة', 'PROVIDERS', true, NOW()),
('PROVIDER_EDIT', 'تعديل مقدم خدمة', 'PROVIDERS', true, NOW()),
('PROVIDER_DELETE', 'حذف مقدم خدمة', 'PROVIDERS', true, NOW()),
('PROVIDER_EXPORT', 'تصدير مقدمي الخدمة', 'PROVIDERS', true, NOW()),

-- Members
('MEMBER_VIEW', 'عرض الأعضاء', 'MEMBERS', true, NOW()),
('MEMBER_CREATE', 'إضافة عضو', 'MEMBERS', true, NOW()),
('MEMBER_EDIT', 'تعديل عضو', 'MEMBERS', true, NOW()),
('MEMBER_DELETE', 'حذف عضو', 'MEMBERS', true, NOW()),
('MEMBER_EXPORT', 'تصدير الأعضاء', 'MEMBERS', true, NOW()),
('MEMBER_IMPORT', 'استيراد الأعضاء', 'MEMBERS', true, NOW()),

-- Contracts & Policies
('POLICY_VIEW', 'عرض السياسات', 'BENEFITS', true, NOW()),
('CONTRACT_VIEW', 'عرض العقود', 'CONTRACTS', true, NOW()),
('CONTRACT_EDIT', 'تعديل العقود', 'CONTRACTS', true, NOW()),

-- Users & Roles
('USER_VIEW', 'عرض المستخدمين', 'SYSTEM', true, NOW()),
('USER_EDIT', 'إدارة المستخدمين والصلاحيات', 'SYSTEM', true, NOW()),

-- Employers (from V1.09)
('EMPLOYER_VIEW', 'عرض الشركاء / أصحاب العمل', 'EMPLOYERS', true, NOW()),
('EMPLOYER_EDIT', 'إدارة الشركاء / أصحاب العمل', 'EMPLOYERS', true, NOW()),

-- Visits (from V1.09)
('VISIT_VIEW', 'عرض سجل الزيارات', 'VISITS', true, NOW()),
('VISIT_EDIT', 'إدارة الزيارات', 'VISITS', true, NOW()),

-- Medical Taxonomy (from V1.09)
('MEDICAL_CATEGORY_VIEW', 'عرض التصنيفات الطبية', 'TAXONOMY', true, NOW()),
('MEDICAL_CATEGORY_EDIT', 'إدارة التصنيفات الطبية', 'TAXONOMY', true, NOW()),
('MEDICAL_SERVICE_VIEW', 'عرض الخدمات الطبية', 'TAXONOMY', true, NOW()),
('MEDICAL_SERVICE_EDIT', 'إدارة الخدمات الطبية', 'TAXONOMY', true, NOW()),
('MEDICAL_PACKAGE_VIEW', 'عرض الحزم الطبية', 'TAXONOMY', true, NOW()),
('MEDICAL_PACKAGE_EDIT', 'إدارة الحزم الطبية', 'TAXONOMY', true, NOW()),

-- Benefit Management (from V1.09)
('BENEFIT_PACKAGE_VIEW', 'عرض حزم المنافع', 'BENEFITS', true, NOW()),
('BENEFIT_PACKAGE_EDIT', 'إدارة حزم المنافع', 'BENEFITS', true, NOW()),
('POLICY_EDIT', 'إدارة سياسات التأمين', 'BENEFITS', true, NOW()),

-- Pre-Authorization (from V1.09)
('PREAUTH_VIEW', 'عرض الموافقات المسبقة', 'PREAUTH', true, NOW()),
('PREAUTH_CREATE', 'طلب موافقة مسبقة', 'PREAUTH', true, NOW()),
('PREAUTH_EDIT', 'معالجة الموافقات المسبقة', 'PREAUTH', true, NOW()),

-- Settlement (from V1.09)
('SETTLEMENT_VIEW', 'عرض التسويات المالية', 'FINANCE', true, NOW()),
('SETTLEMENT_EDIT', 'إدارة التسويات والتدقيق المالي', 'FINANCE', true, NOW()),

-- System & Admin (from V1.09)
('AUDIT_VIEW', 'عرض سجل التدقيق', 'SYSTEM', true, NOW()),
('SETTINGS_EDIT', 'إدارة إعدادات المؤسسة', 'SYSTEM', true, NOW()),
('REPORTS_VIEW', 'عرض التقارير والتحليلات', 'SYSTEM', true, NOW()),

-- Provider Portal (Consolidated)
('PROVIDER_PORTAL_VIEW', 'عرض بوابة مقدم الخدمة', 'PROVIDER_PORTAL', true, NOW());


-- Seed Roles
INSERT INTO roles (name, description, active) VALUES
('SYSTEM_ADMIN', 'مدير النظام - صلاحيات كاملة', true),
('INSURANCE_MANAGER', 'مدير التأمين - إدارة العقود والسياسات', true),
('REVIEWER', 'المراجع - مراجعة واعتماد المطالبات', true),
('PROVIDER_USER', 'مقدم الخدمة - إنشاء وإدارة المطالبات الخاصة', true),
('ACCOUNTANT', 'المحاسب - الإدارة المالية والتسويات', true),
('BENEFICIARY', 'المستفيد - عرض المعلومات الشخصية (قيد التطوير)', true),
('SERVICE_PROVIDER', 'مقدم خدمة', true);

-- Map Permissions to Roles
-- SYSTEM_ADMIN: EVERYTHING
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'SYSTEM_ADMIN';

-- INSURANCE_MANAGER:
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'INSURANCE_MANAGER' 
AND p.name IN (
    'CLAIM_VIEW', 'CLAIM_REPORTS', 'PROVIDER_VIEW', 'MEMBER_VIEW', 'POLICY_VIEW', 'CONTRACT_VIEW', 'CONTRACT_EDIT',
    'EMPLOYER_VIEW', 'EMPLOYER_EDIT', 'VISIT_VIEW', 'REPORTS_VIEW', 'SETTINGS_EDIT'
);

-- REVIEWER:
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'REVIEWER' 
AND p.name IN (
    'CLAIM_VIEW', 'CLAIM_EDIT', 'PROVIDER_VIEW', 'MEMBER_VIEW',
    'PREAUTH_VIEW', 'PREAUTH_EDIT', 'VISIT_VIEW'
);

-- PROVIDER (Unified):
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'SERVICE_PROVIDER'
AND p.name IN (
    'CLAIM_VIEW', 'CLAIM_CREATE', 'CLAIM_EDIT', 'MEMBER_VIEW',
    'VISIT_VIEW', 'VISIT_EDIT', 'PREAUTH_VIEW', 'PREAUTH_CREATE',
    'PROVIDER_PORTAL_VIEW'
);

-- ACCOUNTANT:
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'ACCOUNTANT' 
AND p.name IN ('CLAIM_VIEW', 'CLAIM_EXPORT', 'CLAIM_REPORTS', 'PROVIDER_VIEW', 'SETTLEMENT_VIEW');

