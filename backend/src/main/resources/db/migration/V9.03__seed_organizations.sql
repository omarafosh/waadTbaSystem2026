-- ═══════════════════════════════════════════════════════════════════════════
-- V9.03: Seed Organizations
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. SYSTEM OWNER (WAAD)
INSERT INTO organizations (
    name, code, type, active, is_default, currency, created_at, updated_at
) VALUES (
    'WAAD Insurance TPA', 
    'WAAD-TPA-001', 
    'TPA', 
    true, 
    true, 
    'LYD', 
    NOW(), 
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- 2. DEMO INSURANCE COMPANY
INSERT INTO organizations (
    name, code, type, active, is_default, currency, created_at, updated_at
) VALUES (
    'Libya Insurance Company', 
    'LIC-001', 
    'INSURANCE', 
    true, 
    false, 
    'LYD', 
    NOW(), 
    NOW()
) ON CONFLICT (code) DO NOTHING;
