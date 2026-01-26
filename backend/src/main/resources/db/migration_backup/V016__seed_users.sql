-- ═══════════════════════════════════════════════════════════════════════════
-- V016: Seed Default System Users - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Seed default admin users for initial system access
-- Dependencies: V015 (roles and permissions)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- SEED DEFAULT SUPER ADMIN USER
-- Password: admin123 (BCrypt encoded)
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO users (
    username,
    password,
    email,
    full_name,
    full_name_ar,
    status,
    role_id,
    active,
    created_by
) SELECT
    'admin',
    '$2a$10$EqKcp1WFKVQISheBxNR5/.z5HLl5YQJHrLMKVmPrO4hR3Cqe0z9kq',  -- admin123
    'admin@tba-waad.com',
    'System Administrator',
    'مدير النظام',
    'ACTIVE'::user_status,
    r.id,
    TRUE,
    'SYSTEM'
FROM roles r WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT (username) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- SEED TEST USERS FOR DEVELOPMENT
-- ───────────────────────────────────────────────────────────────────────────

-- Employer Admin User
INSERT INTO users (
    username,
    password,
    email,
    full_name,
    full_name_ar,
    status,
    role_id,
    active,
    created_by
) SELECT
    'employer_admin',
    '$2a$10$EqKcp1WFKVQISheBxNR5/.z5HLl5YQJHrLMKVmPrO4hR3Cqe0z9kq',  -- admin123
    'employer@tba-waad.com',
    'Employer Administrator',
    'مدير جهة العمل',
    'ACTIVE'::user_status,
    r.id,
    TRUE,
    'SYSTEM'
FROM roles r WHERE r.name = 'EMPLOYER_ADMIN'
ON CONFLICT (username) DO NOTHING;

-- HR Manager User
INSERT INTO users (
    username,
    password,
    email,
    full_name,
    full_name_ar,
    status,
    role_id,
    active,
    created_by
) SELECT
    'hr_manager',
    '$2a$10$EqKcp1WFKVQISheBxNR5/.z5HLl5YQJHrLMKVmPrO4hR3Cqe0z9kq',  -- admin123
    'hr@tba-waad.com',
    'HR Manager',
    'مدير الموارد البشرية',
    'ACTIVE'::user_status,
    r.id,
    TRUE,
    'SYSTEM'
FROM roles r WHERE r.name = 'HR_MANAGER'
ON CONFLICT (username) DO NOTHING;

-- Provider Admin User
INSERT INTO users (
    username,
    password,
    email,
    full_name,
    full_name_ar,
    status,
    role_id,
    active,
    created_by
) SELECT
    'provider_admin',
    '$2a$10$EqKcp1WFKVQISheBxNR5/.z5HLl5YQJHrLMKVmPrO4hR3Cqe0z9kq',  -- admin123
    'provider@tba-waad.com',
    'Provider Administrator',
    'مدير مقدم الخدمة',
    'ACTIVE'::user_status,
    r.id,
    TRUE,
    'SYSTEM'
FROM roles r WHERE r.name = 'PROVIDER_ADMIN'
ON CONFLICT (username) DO NOTHING;

-- Claims Officer User
INSERT INTO users (
    username,
    password,
    email,
    full_name,
    full_name_ar,
    status,
    role_id,
    active,
    created_by
) SELECT
    'claims_officer',
    '$2a$10$EqKcp1WFKVQISheBxNR5/.z5HLl5YQJHrLMKVmPrO4hR3Cqe0z9kq',  -- admin123
    'claims@tba-waad.com',
    'Claims Officer',
    'موظف المطالبات',
    'ACTIVE'::user_status,
    r.id,
    TRUE,
    'SYSTEM'
FROM roles r WHERE r.name = 'CLAIMS_OFFICER'
ON CONFLICT (username) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V016
-- ═══════════════════════════════════════════════════════════════════════════
