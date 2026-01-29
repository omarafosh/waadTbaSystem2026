-- =====================================================================
-- V069__fix_duplicate_card_numbers.sql
-- Fix existing duplicate card numbers for dependents with same relationship
-- 
-- Problem: Multiple dependents with same relationship type (e.g., 3 sons)
-- were getting identical card numbers like ES-2026-100009S
--
-- Solution: Add sequence number to make them unique:
-- - First son:  ES-2026-100009S (no change if only one)
-- - Second son: ES-2026-100009S2
-- - Third son:  ES-2026-100009S3
-- =====================================================================

-- Step 1: Create a function to fix duplicate card numbers
CREATE OR REPLACE FUNCTION fix_duplicate_card_numbers() RETURNS void AS $$
DECLARE
    duplicate_record RECORD;
    seq_counter INTEGER;
    last_card_number VARCHAR(50);
BEGIN
    -- Find all card numbers that appear more than once
    FOR duplicate_record IN 
        SELECT card_number, COUNT(*) as cnt
        FROM members
        WHERE card_number IS NOT NULL 
          AND parent_id IS NOT NULL  -- Only dependents
        GROUP BY card_number
        HAVING COUNT(*) > 1
        ORDER BY card_number
    LOOP
        RAISE NOTICE 'Fixing duplicate card number: % (% duplicates)', 
            duplicate_record.card_number, duplicate_record.cnt;
        
        -- Reset counter for each duplicate group
        seq_counter := 1;
        
        -- Update each duplicate (keep first one, update rest with sequence)
        FOR duplicate_record IN
            SELECT m.id, m.card_number, m.relationship, m.created_at
            FROM members m
            WHERE m.card_number = duplicate_record.card_number
            ORDER BY m.created_at ASC, m.id ASC
        LOOP
            IF seq_counter = 1 THEN
                -- Keep first record unchanged (already has no sequence number)
                seq_counter := seq_counter + 1;
            ELSE
                -- Add sequence number to subsequent duplicates
                last_card_number := duplicate_record.card_number;
                
                -- Update with sequence number appended
                UPDATE members 
                SET card_number = duplicate_record.card_number || seq_counter
                WHERE id = duplicate_record.id;
                
                RAISE NOTICE '  Updated member ID % from % to %', 
                    duplicate_record.id, 
                    duplicate_record.card_number,
                    duplicate_record.card_number || seq_counter;
                
                seq_counter := seq_counter + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Duplicate card number fix completed.';
END;
$$ LANGUAGE plpgsql;

-- Step 2: Execute the fix
SELECT fix_duplicate_card_numbers();

-- Step 3: Drop the function after use
DROP FUNCTION IF EXISTS fix_duplicate_card_numbers();

-- Step 4: Verify no more duplicates exist
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT card_number
        FROM members
        WHERE card_number IS NOT NULL
        GROUP BY card_number
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'WARNING: % duplicate card numbers still exist!', duplicate_count;
    ELSE
        RAISE NOTICE 'SUCCESS: No duplicate card numbers found.';
    END IF;
END $$;

-- Step 5: Add a comment for documentation
COMMENT ON TABLE members IS 'Card numbers are now unique with sequential suffixes for same-relationship dependents (e.g., S1, S2, S3 for multiple sons)';
