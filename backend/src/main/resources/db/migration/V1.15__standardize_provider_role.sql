-- ═══════════════════════════════════════════════════════════════════════════
-- V1.15: Standardize Provider Roles
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ensure 'PROVIDER' role exists
INSERT INTO roles (name, description, active, created_at)
SELECT 'PROVIDER', 'Healthcare Provider - مقدم خدمة', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'PROVIDER');

-- 2. Migrate users from 'SERVICE_PROVIDER' and 'PROVIDER_USER' to 'PROVIDER'
DO $$
DECLARE
    provider_role_id BIGINT;
    service_provider_role_id BIGINT;
    provider_user_role_id BIGINT;
BEGIN
    SELECT id INTO provider_role_id FROM roles WHERE name = 'PROVIDER';
    SELECT id INTO service_provider_role_id FROM roles WHERE name = 'SERVICE_PROVIDER';
    SELECT id INTO provider_user_role_id FROM roles WHERE name = 'PROVIDER_USER';

    -- Migrate 'SERVICE_PROVIDER' assignments
    IF service_provider_role_id IS NOT NULL THEN
        UPDATE user_roles SET role_id = provider_role_id 
        WHERE role_id = service_provider_role_id 
        AND user_id NOT IN (SELECT user_id FROM user_roles WHERE role_id = provider_role_id);
        
        DELETE FROM user_roles WHERE role_id = service_provider_role_id;
    END IF;

    -- Migrate 'PROVIDER_USER' assignments
    IF provider_user_role_id IS NOT NULL THEN
        UPDATE user_roles SET role_id = provider_role_id 
        WHERE role_id = provider_user_role_id 
        AND user_id NOT IN (SELECT user_id FROM user_roles WHERE role_id = provider_role_id);
        
        DELETE FROM user_roles WHERE role_id = provider_user_role_id;
    END IF;
END $$;

-- 3. Copy permissions to 'PROVIDER' if they are missing
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'PROVIDER'), p.id
FROM permissions p
WHERE p.name IN (
    'CLAIM_VIEW', 'CLAIM_CREATE', 'CLAIM_EDIT', 'MEMBER_VIEW',
    'VISIT_VIEW', 'VISIT_EDIT', 'PREAUTH_VIEW', 'PREAUTH_CREATE',
    'PROVIDER_PORTAL_VIEW'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'PROVIDER') 
    AND rp.permission_id = p.id
);

-- 4. Delete legacy roles
DELETE FROM roles WHERE name IN ('SERVICE_PROVIDER', 'PROVIDER_USER');
