-- ═══════════════════════════════════════════════════════════════════════════
-- V1.20: Seed Default Role Permissions (The Single Source of Truth)
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Consolidates ALL default permission assignments for ALL system roles.
-- Run this to reset/update permissions to the standard baseline.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    -- Role IDs
    role_super_admin_id BIGINT;
    role_ins_admin_id BIGINT;
    role_provider_id BIGINT;
    role_reviewer_id BIGINT;
    role_accountant_id BIGINT;
    role_beneficiary_id BIGINT;

    -- Permission Definitions
    perm_name TEXT;
    
    -- ALL system permissions
    all_perms TEXT[] := ARRAY[
        -- Claims
        'CLAIM_VIEW', 'CLAIM_CREATE', 'CLAIM_EDIT', 'CLAIM_DELETE', 'CLAIM_EXPORT', 'CLAIM_IMPORT', 'CLAIM_REPORTS',
        -- Providers
        'PROVIDER_VIEW', 'PROVIDER_CREATE', 'PROVIDER_EDIT', 'PROVIDER_DELETE', 'PROVIDER_EXPORT',
        -- Members
        'MEMBER_VIEW', 'MEMBER_CREATE', 'MEMBER_EDIT', 'MEMBER_DELETE', 'MEMBER_EXPORT', 'MEMBER_IMPORT',
        -- Benefits & Policies
        'POLICY_VIEW', 'POLICY_EDIT', 'BENEFIT_PACKAGE_VIEW', 'BENEFIT_PACKAGE_EDIT',
        -- Contracts
        'CONTRACT_VIEW', 'CONTRACT_EDIT',
        -- System & Users
        'USER_VIEW', 'USER_EDIT', 'AUDIT_VIEW', 'SETTINGS_EDIT', 'REPORTS_VIEW',
        -- Employers
        'EMPLOYER_VIEW', 'EMPLOYER_EDIT',
        -- Visits
        'VISIT_VIEW', 'VISIT_EDIT',
        -- Medical Taxonomy
        'MEDICAL_CATEGORY_VIEW', 'MEDICAL_CATEGORY_EDIT', 'MEDICAL_SERVICE_VIEW', 'MEDICAL_SERVICE_EDIT', 'MEDICAL_PACKAGE_VIEW', 'MEDICAL_PACKAGE_EDIT',
        -- Pre-Authorization
        'PREAUTH_VIEW', 'PREAUTH_CREATE', 'PREAUTH_EDIT',
        -- Finance & Settlements
        'SETTLEMENT_VIEW', 'SETTLEMENT_EDIT',
        -- Provider Portal specific
        'PROVIDER_PORTAL_VIEW'
    ];

BEGIN
    -- 1. Ensure Permissions Exist
    -- This ensures the 'permissions' table contains every permission defined in the system.
    FOREACH perm_name IN ARRAY all_perms
    LOOP
        INSERT INTO permissions (name, description, created_at, active)
        SELECT perm_name, 'Standard System Permission', NOW(), true
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = perm_name);
    END LOOP;

    -- 2. Fetch Role IDs
    SELECT id INTO role_super_admin_id FROM roles WHERE name = 'SUPER_ADMIN';
    SELECT id INTO role_ins_admin_id FROM roles WHERE name = 'INSURANCE_ADMIN';
    SELECT id INTO role_provider_id FROM roles WHERE name = 'PROVIDER';
    SELECT id INTO role_reviewer_id FROM roles WHERE name = 'REVIEWER';
    SELECT id INTO role_accountant_id FROM roles WHERE name = 'ACCOUNTANT';
    SELECT id INTO role_beneficiary_id FROM roles WHERE name = 'BENEFICIARY';

    -- 3. Clear Existing Role Permissions (Optional: Uncomment to force strict reset)
    -- DELETE FROM role_permissions; 
    -- We will use INSERT ON CONFLICT DO NOTHING to be additive/safe.

    -- ════════════════════════════════════════════════════════════
    -- ASSIGN PERMISSIONS TO ROLES
    -- ════════════════════════════════════════════════════════════

    -- A. SUPER_ADMIN: Gets EVERYTHING
    IF role_super_admin_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT role_super_admin_id, id FROM permissions
        ON CONFLICT DO NOTHING;
    END IF;

    -- B. INSURANCE_ADMIN: Full Operational Control (Except extreme system settings)
    IF role_ins_admin_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT role_ins_admin_id, p.id FROM permissions p
        WHERE p.name IN (
            'CLAIM_VIEW', 'CLAIM_REPORTS', 'CLAIM_EXPORT',
            'PROVIDER_VIEW', 'PROVIDER_EDIT', 'PROVIDER_EXPORT',
            'MEMBER_VIEW', 'MEMBER_EDIT', 'MEMBER_EXPORT', 'MEMBER_IMPORT',
            'POLICY_VIEW', 'POLICY_EDIT', 
            'CONTRACT_VIEW', 'CONTRACT_EDIT',
            'EMPLOYER_VIEW', 'EMPLOYER_EDIT', 
            'VISIT_VIEW', 
            'REPORTS_VIEW', 'SETTINGS_EDIT',
            'BENEFIT_PACKAGE_VIEW', 'BENEFIT_PACKAGE_EDIT',
            'MEDICAL_CATEGORY_VIEW', 'MEDICAL_CATEGORY_EDIT', 'MEDICAL_SERVICE_VIEW', 'MEDICAL_SERVICE_EDIT',
            'PREAUTH_VIEW', 'PREAUTH_EDIT',
            'SETTLEMENT_VIEW', 'SETTLEMENT_EDIT'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- C. PROVIDER: Portal Access & Operations
    IF role_provider_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT role_provider_id, p.id FROM permissions p
        WHERE p.name IN (
            'PROVIDER_PORTAL_VIEW',
            'VISIT_VIEW', 'VISIT_EDIT', -- Can register visits
            'MEMBER_VIEW',              -- Can check eligibility
            'CLAIM_VIEW', 'CLAIM_CREATE', 'CLAIM_EDIT', -- Can submit claims
            'PREAUTH_VIEW', 'PREAUTH_CREATE' -- Can request pre-auth
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- D. REVIEWER: Review Claims & Pre-auths
    IF role_reviewer_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT role_reviewer_id, p.id FROM permissions p
        WHERE p.name IN (
            'CLAIM_VIEW', 'CLAIM_EDIT', -- Edit status (Approve/Reject)
            'PREAUTH_VIEW', 'PREAUTH_EDIT',
            'PROVIDER_VIEW', 
            'MEMBER_VIEW',
            'VISIT_VIEW',
            'POLICY_VIEW', 'CONTRACT_VIEW' -- Need to see policy coverage
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- E. ACCOUNTANT: Financials
    IF role_accountant_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT role_accountant_id, p.id FROM permissions p
        WHERE p.name IN (
            'CLAIM_VIEW', 'CLAIM_REPORTS', 'CLAIM_EXPORT',
            'PROVIDER_VIEW', 
            'SETTLEMENT_VIEW', 'SETTLEMENT_EDIT'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- F. BENEFICIARY: Self-Service
    IF role_beneficiary_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT role_beneficiary_id, p.id FROM permissions p
        WHERE p.name IN (
            'MEMBER_VIEW', -- View own profile (logic handled in app)
            'CLAIM_VIEW',  -- View own claims
            'PREAUTH_VIEW' -- View own approvals
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'All roles have been seeded with default permissions.';
END $$;
