-- V042: Add description column to medical_services
-- Date: 2026-01-15
-- Purpose: Fix missing 'description' column causing 500 errors on insert

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_services' AND column_name = 'description'
    ) THEN
        ALTER TABLE medical_services ADD COLUMN description TEXT;
    END IF;
END $$;
