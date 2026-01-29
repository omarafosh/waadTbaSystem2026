-- Rename existing "WAAD" organization code to "MAIN-ORG" to separate it from the Barcode Prefix
-- This ensures the "Company Code" field shows "MAIN-ORG" instead of "WAAD", 
-- satisfying the user request to "Remove barcode prefix from company code field".

UPDATE organizations 
SET code = 'MAIN-ORG' 
WHERE code = 'WAAD';

-- Ensure barcode_prefix is still WAAD (set in previous migration, but reinforcing)
UPDATE organizations 
SET barcode_prefix = 'WAAD' 
WHERE code = 'MAIN-ORG';
