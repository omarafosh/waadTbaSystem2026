-- ===============================================================
-- Test Data for Phase 1: Card Number Eligibility Check
-- Purpose: Sample data for testing the unified smart search
-- Date: 2026-01-09
-- ===============================================================

-- Note: This is sample data for testing purposes only
-- DO NOT run this in production without modifications

-- Sample 1: Active Member with Card Number
-- Expected Result: Eligible
INSERT INTO members (
    full_name, 
    card_number, 
    barcode,
    status, 
    card_status,
    eligibility_status,
    active,
    employer_org_id,
    created_at,
    updated_at
) VALUES (
    'أحمد محمد علي',
    '12345',
    'TEST-BARCODE-001',
    'ACTIVE',
    'ACTIVE',
    true,
    true,
    1, -- Replace with valid employer_org_id
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (card_number) DO NOTHING;

-- Sample 2: Suspended Member
-- Expected Result: Not Eligible (Status: SUSPENDED)
INSERT INTO members (
    full_name, 
    card_number, 
    barcode,
    status, 
    card_status,
    eligibility_status,
    active,
    employer_org_id,
    created_at,
    updated_at
) VALUES (
    'فاطمة سعيد محمود',
    '54321',
    'TEST-BARCODE-002',
    'SUSPENDED',
    'ACTIVE',
    false,
    true,
    1, -- Replace with valid employer_org_id
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (card_number) DO NOTHING;

-- Sample 3: Active Member with Blocked Card
-- Expected Result: Not Eligible (Card Status: BLOCKED)
INSERT INTO members (
    full_name, 
    card_number, 
    barcode,
    status, 
    card_status,
    eligibility_status,
    active,
    employer_org_id,
    created_at,
    updated_at
) VALUES (
    'محمد علي حسن',
    '11111',
    'TEST-BARCODE-003',
    'ACTIVE',
    'BLOCKED',
    true,
    true,
    1, -- Replace with valid employer_org_id
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (card_number) DO NOTHING;

-- Sample 4: Inactive Member
-- Expected Result: Not Eligible (Active: false)
INSERT INTO members (
    full_name, 
    card_number, 
    barcode,
    status, 
    card_status,
    eligibility_status,
    active,
    employer_org_id,
    created_at,
    updated_at
) VALUES (
    'سارة أحمد محمد',
    '22222',
    'TEST-BARCODE-004',
    'ACTIVE',
    'ACTIVE',
    true,
    false,
    1, -- Replace with valid employer_org_id
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (card_number) DO NOTHING;

-- Sample 5: Active Member without Card Number
-- Expected Result: Cannot be found via card number search
INSERT INTO members (
    full_name, 
    card_number, 
    barcode,
    status, 
    card_status,
    eligibility_status,
    active,
    employer_org_id,
    created_at,
    updated_at
) VALUES (
    'خالد محمود إبراهيم',
    NULL,
    'TEST-BARCODE-005',
    'ACTIVE',
    'ACTIVE',
    true,
    true,
    1, -- Replace with valid employer_org_id
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verification Queries
-- ====================

-- 1. List all test members
SELECT 
    id,
    full_name,
    card_number,
    status,
    card_status,
    eligibility_status,
    active
FROM members
WHERE card_number IN ('12345', '54321', '11111', '22222')
   OR barcode LIKE 'TEST-BARCODE-%'
ORDER BY card_number NULLS LAST;

-- 2. Test Index Performance
EXPLAIN ANALYZE
SELECT * FROM members 
WHERE card_number = '12345';

-- Expected: Index Scan using idx_members_card_number

-- 3. Test Eligibility Logic
SELECT 
    card_number,
    full_name,
    CASE 
        WHEN status = 'ACTIVE' 
         AND card_status = 'ACTIVE' 
         AND eligibility_status = true 
         AND active = true 
        THEN 'ELIGIBLE'
        ELSE 'NOT ELIGIBLE'
    END as eligibility_result,
    CASE 
        WHEN status != 'ACTIVE' THEN 'Member Status: ' || status
        WHEN card_status != 'ACTIVE' THEN 'Card Status: ' || card_status
        WHEN eligibility_status != true THEN 'Not Eligible'
        WHEN active != true THEN 'Inactive'
        ELSE ''
    END as reason
FROM members
WHERE card_number IN ('12345', '54321', '11111', '22222')
ORDER BY card_number;

-- Cleanup Test Data (OPTIONAL - use with caution)
-- DELETE FROM members WHERE barcode LIKE 'TEST-BARCODE-%';
