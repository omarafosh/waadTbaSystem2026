-- ═══════════════════════════════════════════════════════════════════════════
-- V9.05: Seed Employer Organization (جليانة)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. EMPLOYER: جليانة
INSERT INTO organizations (
    name, code, type, active, archived, barcode_prefix, created_at, updated_at
) VALUES (
    'جليانة', 
    'EMP-01', 
    'EMPLOYER', 
    true, 
    false,
    'WAAD', 
    NOW(), 
    NOW()
) ON CONFLICT (code) DO NOTHING;
