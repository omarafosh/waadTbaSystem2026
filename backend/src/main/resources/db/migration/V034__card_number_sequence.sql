-- ==============================================================================
-- Card Number Sequence Creation
-- ==============================================================================
-- Version: V201
-- Date: 2026-01-11
-- Purpose: Create sequence for unified card number generation
-- ==============================================================================

-- Create sequence for card numbers if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'member_card_number_seq'
    ) THEN
        CREATE SEQUENCE member_card_number_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        
        RAISE NOTICE '✅ Created sequence: member_card_number_seq';
    ELSE
        RAISE NOTICE 'ℹ️ Sequence already exists: member_card_number_seq';
    END IF;
END $$;

-- Add comments
COMMENT ON SEQUENCE member_card_number_seq IS 
'Sequence for generating unified card numbers. Principal: NNNNNN, Dependent: NNNNNN-NN';

-- ==============================================================================
-- COMPLETION MESSAGE
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ CARD NUMBER SEQUENCE - CREATED';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Sequence: member_card_number_seq';
    RAISE NOTICE 'Format: Principal = NNNNNN, Dependent = NNNNNN-NN';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
