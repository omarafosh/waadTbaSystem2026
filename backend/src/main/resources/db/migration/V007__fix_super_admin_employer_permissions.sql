-- ═══════════════════════════════════════════════════════════════════════════
-- V008: Fix SUPER_ADMIN Employer Permissions
-- TBA WAAD System - Ensure SUPER_ADMIN has all required permissions
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Ensure VIEW_EMPLOYERS and MANAGE_EMPLOYERS permissions exist
--          and are assigned to SUPER_ADMIN role
-- Issue: 403 Forbidden when SUPER_ADMIN tries to create Employer
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- Step 1: Ensure Employer permissions exist
-- ───────────────────────────────────────────────────────────────────────────

-- Insert VIEW_EMPLOYERS permission if not exists
INSERT INTO permissions (name, description, created_at, updated_at)
SELECT 
    'VIEW_EMPLOYERS',
    'View employer information | عرض أصحاب العمل',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE name = 'VIEW_EMPLOYERS'
);

-- Insert MANAGE_EMPLOYERS permission if not exists
INSERT INTO permissions (name, description, created_at, updated_at)
SELECT 
    'MANAGE_EMPLOYERS',
    'Full management of employer companies | إدارة أصحاب العمل',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE name = 'MANAGE_EMPLOYERS'
);

-- ───────────────────────────────────────────────────────────────────────────
-- Step 2: Assign permissions to SUPER_ADMIN role
-- ───────────────────────────────────────────────────────────────────────────

-- Add VIEW_EMPLOYERS to SUPER_ADMIN if not already assigned
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
  AND p.name = 'VIEW_EMPLOYERS'
  AND NOT EXISTS (
      SELECT 1 
      FROM role_permissions rp 
      WHERE rp.role_id = r.id 
        AND rp.permission_id = p.id
  );

-- Add MANAGE_EMPLOYERS to SUPER_ADMIN if not already assigned
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
  AND p.name = 'MANAGE_EMPLOYERS'
  AND NOT EXISTS (
      SELECT 1 
      FROM role_permissions rp 
      WHERE rp.role_id = r.id 
        AND rp.permission_id = p.id
  );

-- ───────────────────────────────────────────────────────────────────────────
-- Step 3: Verify and log results
-- ───────────────────────────────────────────────────────────────────────────

-- This will show up in migration logs
DO $$
DECLARE
    v_super_admin_perms INTEGER;
    v_total_perms INTEGER;
BEGIN
    -- Count SUPER_ADMIN permissions
    SELECT COUNT(*) INTO v_super_admin_perms
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = 'SUPER_ADMIN';
    
    -- Count total permissions
    SELECT COUNT(*) INTO v_total_perms
    FROM permissions;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'V008 Migration Complete: SUPER_ADMIN Employer Permissions Fixed';
    RAISE NOTICE '───────────────────────────────────────────────────────────────';
    RAISE NOTICE 'SUPER_ADMIN Permissions: % / % assigned', v_super_admin_perms, v_total_perms;
    
    -- Verify critical permissions
    IF EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.name = 'SUPER_ADMIN' 
          AND p.name IN ('VIEW_EMPLOYERS', 'MANAGE_EMPLOYERS')
    ) THEN
        RAISE NOTICE '✓ Employer permissions successfully assigned to SUPER_ADMIN';
    ELSE
        RAISE WARNING '⚠ Failed to assign Employer permissions to SUPER_ADMIN';
    END IF;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- END V008
-- ═══════════════════════════════════════════════════════════════════════════
