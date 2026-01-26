-- =====================================================
-- V018: Comprehensive Schema Alignment
-- Date: 2026-01-01
-- Purpose: Complete alignment between database schema and JPA entities
--          This migration adds all missing columns to ensure schema validation passes
-- =====================================================

-- =====================================================
-- Part 1: Fix medical_services table
-- =====================================================

-- Add base_price column (replaces/supplements price_lyd)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_services' AND column_name = 'base_price'
    ) THEN
        ALTER TABLE medical_services 
        ADD COLUMN base_price DECIMAL(10, 2);
        
        -- Migrate data from price_lyd to base_price if price_lyd exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'medical_services' AND column_name = 'price_lyd'
        ) THEN
            UPDATE medical_services SET base_price = price_lyd::DECIMAL(10,2);
        END IF;
        
        RAISE NOTICE 'Added base_price column to medical_services';
    END IF;
END $$;

-- Add requires_pa column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_services' AND column_name = 'requires_pa'
    ) THEN
        ALTER TABLE medical_services 
        ADD COLUMN requires_pa BOOLEAN NOT NULL DEFAULT FALSE;
        
        RAISE NOTICE 'Added requires_pa column to medical_services';
    END IF;
END $$;

-- Add active column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_services' AND column_name = 'active'
    ) THEN
        ALTER TABLE medical_services 
        ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
        
        RAISE NOTICE 'Added active column to medical_services';
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN medical_services.base_price IS 'Base/reference price for estimation and reporting (NOT for final claim calculation)';
COMMENT ON COLUMN medical_services.requires_pa IS 'Flag indicating if service requires pre-authorization';
COMMENT ON COLUMN medical_services.active IS 'Soft delete flag - whether the service is active';

-- =====================================================
-- Part 2: Ensure medical_categories has all required columns
-- =====================================================

-- Add active column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_categories' AND column_name = 'active'
    ) THEN
        ALTER TABLE medical_categories 
        ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
        
        RAISE NOTICE 'Added active column to medical_categories';
    END IF;
END $$;

-- Add parent_id column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_categories' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE medical_categories 
        ADD COLUMN parent_id BIGINT;
        
        RAISE NOTICE 'Added parent_id column to medical_categories';
    END IF;
END $$;

-- =====================================================
-- Part 3: Verify critical tables exist
-- =====================================================

-- Verify legacy_provider_contracts exists (should be created by V014)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'legacy_provider_contracts'
    ) THEN
        RAISE WARNING 'Table legacy_provider_contracts is missing - should have been created by V014';
    END IF;
END $$;

-- Verify pre_authorization_audit exists (should be created by V014)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pre_authorization_audit'
    ) THEN
        RAISE WARNING 'Table pre_authorization_audit is missing - should have been created by V014';
    END IF;
END $$;

-- Verify provider_services exists (should be created by V014)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'provider_services'
    ) THEN
        RAISE WARNING 'Table provider_services is missing - should have been created by V014';
    END IF;
END $$;

-- =====================================================
-- Part 4: Final Summary
-- =====================================================

DO $$
DECLARE
    v_medical_services_columns INT;
    v_medical_categories_columns INT;
BEGIN
    -- Count columns in medical_services
    SELECT COUNT(*) INTO v_medical_services_columns
    FROM information_schema.columns 
    WHERE table_name = 'medical_services' 
    AND column_name IN ('base_price', 'requires_pa', 'active');
    
    -- Count columns in medical_categories
    SELECT COUNT(*) INTO v_medical_categories_columns
    FROM information_schema.columns 
    WHERE table_name = 'medical_categories' 
    AND column_name IN ('active', 'parent_id');
    
    RAISE NOTICE '════════════════════════════════════════════════════';
    RAISE NOTICE 'V018 Schema Alignment Complete';
    RAISE NOTICE '────────────────────────────────────────────────────';
    RAISE NOTICE 'medical_services: %/3 critical columns added', v_medical_services_columns;
    RAISE NOTICE 'medical_categories: %/2 critical columns added', v_medical_categories_columns;
    RAISE NOTICE '════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- END V018
-- =====================================================
