-- =====================================================
-- Comprehensive Pre-Authorizations Schema Alignment
-- Version: V021
-- Date: 2026-01-01
-- Purpose: Add all missing columns to align with PreAuthorization Entity
-- =====================================================

-- Add reference_number (Entity field)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'reference_number') THEN
        ALTER TABLE pre_authorizations ADD COLUMN reference_number VARCHAR(50);
        RAISE NOTICE 'pre_authorizations: Added reference_number column';
    END IF;
END $$;

-- Add service_code (Entity uses this instead of diagnosis_code)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'service_code') THEN
        ALTER TABLE pre_authorizations ADD COLUMN service_code VARCHAR(50);
        RAISE NOTICE 'pre_authorizations: Added service_code column';
    END IF;
END $$;

-- Add expiry_date (different from approval_expiry_date)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'expiry_date') THEN
        ALTER TABLE pre_authorizations ADD COLUMN expiry_date DATE;
        RAISE NOTICE 'pre_authorizations: Added expiry_date column';
    END IF;
END $$;

-- Add requested_amount
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'requested_amount') THEN
        ALTER TABLE pre_authorizations ADD COLUMN requested_amount DECIMAL(10, 2);
        RAISE NOTICE 'pre_authorizations: Added requested_amount column';
    END IF;
END $$;

-- Add contract_price
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'contract_price') THEN
        ALTER TABLE pre_authorizations ADD COLUMN contract_price DECIMAL(10, 2);
        RAISE NOTICE 'pre_authorizations: Added contract_price column';
    END IF;
END $$;

-- Add copay_amount
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'copay_amount') THEN
        ALTER TABLE pre_authorizations ADD COLUMN copay_amount DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'pre_authorizations: Added copay_amount column';
    END IF;
END $$;

-- Add copay_percentage
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'copay_percentage') THEN
        ALTER TABLE pre_authorizations ADD COLUMN copay_percentage DECIMAL(5, 2) DEFAULT 0;
        RAISE NOTICE 'pre_authorizations: Added copay_percentage column';
    END IF;
END $$;

-- Add insurance_covered_amount
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'insurance_covered_amount') THEN
        ALTER TABLE pre_authorizations ADD COLUMN insurance_covered_amount DECIMAL(10, 2);
        RAISE NOTICE 'pre_authorizations: Added insurance_covered_amount column';
    END IF;
END $$;

-- Add currency
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'currency') THEN
        ALTER TABLE pre_authorizations ADD COLUMN currency VARCHAR(3) DEFAULT 'LYD';
        RAISE NOTICE 'pre_authorizations: Added currency column';
    END IF;
END $$;

-- Add priority
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'priority') THEN
        ALTER TABLE pre_authorizations ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL';
        RAISE NOTICE 'pre_authorizations: Added priority column';
    END IF;
END $$;

-- Add diagnosis
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'diagnosis') THEN
        ALTER TABLE pre_authorizations ADD COLUMN diagnosis VARCHAR(500);
        RAISE NOTICE 'pre_authorizations: Added diagnosis column';
    END IF;
END $$;

-- Add notes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'notes') THEN
        ALTER TABLE pre_authorizations ADD COLUMN notes VARCHAR(1000);
        RAISE NOTICE 'pre_authorizations: Added notes column';
    END IF;
END $$;

-- Add rejection_reason (different from existing one)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'rejection_reason') THEN
        ALTER TABLE pre_authorizations ADD COLUMN rejection_reason VARCHAR(500);
        RAISE NOTICE 'pre_authorizations: Added rejection_reason column';
    END IF;
END $$;

-- Add created_by
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'created_by') THEN
        ALTER TABLE pre_authorizations ADD COLUMN created_by VARCHAR(100);
        RAISE NOTICE 'pre_authorizations: Added created_by column';
    END IF;
END $$;

-- Add updated_by
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pre_authorizations' AND column_name = 'updated_by') THEN
        ALTER TABLE pre_authorizations ADD COLUMN updated_by VARCHAR(100);
        RAISE NOTICE 'pre_authorizations: Added updated_by column';
    END IF;
END $$;

-- Validation
DO $$
DECLARE
    v_missing_columns TEXT[];
    v_col_name TEXT;
BEGIN
    -- Check all required columns
    SELECT ARRAY_AGG(col) INTO v_missing_columns
    FROM (VALUES 
        ('reference_number'),
        ('service_code'),
        ('expiry_date'),
        ('requested_amount'),
        ('contract_price'),
        ('copay_amount'),
        ('copay_percentage'),
        ('insurance_covered_amount'),
        ('currency'),
        ('priority'),
        ('diagnosis'),
        ('notes'),
        ('created_by'),
        ('updated_by'),
        ('approved_at'),
        ('approved_by')
    ) AS cols(col)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pre_authorizations' AND column_name = cols.col
    );
    
    IF v_missing_columns IS NOT NULL AND array_length(v_missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'V021 migration failed: Missing columns in pre_authorizations: %', 
            array_to_string(v_missing_columns, ', ');
    END IF;
    
    RAISE NOTICE '✓ V021 validation passed: All pre_authorizations columns present (16 columns)';
END $$;

-- Add comments
COMMENT ON COLUMN pre_authorizations.reference_number IS 'Unique reference number (PA-YYYYMMDD-XXXXX)';
COMMENT ON COLUMN pre_authorizations.service_code IS 'Medical service code from medical_services table';
COMMENT ON COLUMN pre_authorizations.contract_price IS 'Price from provider contract if applicable';
COMMENT ON COLUMN pre_authorizations.copay_amount IS 'Member copay amount based on policy';
COMMENT ON COLUMN pre_authorizations.copay_percentage IS 'Copay percentage from policy';
COMMENT ON COLUMN pre_authorizations.insurance_covered_amount IS 'Amount covered by insurance';
COMMENT ON COLUMN pre_authorizations.currency IS 'Currency code (ISO 4217)';
COMMENT ON COLUMN pre_authorizations.priority IS 'Priority: EMERGENCY, URGENT, NORMAL, LOW';
