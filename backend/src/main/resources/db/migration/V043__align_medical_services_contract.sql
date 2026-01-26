-- V043: Align Medical Services with Contract (Strict Mode)
-- Date: 2026-01-15
-- Purpose: Remove non-contract fields and loosen constraints on optional fields
-- Contract: MEDICAL_SERVICES_API_CONTRACT.md v1.0.0

DO $$
BEGIN
    -- 1. Remove forbidden fields
    -- price_lyd is strictly forbidden (replaced by base_price)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_services' AND column_name = 'price_lyd') THEN
        ALTER TABLE medical_services DROP COLUMN price_lyd;
    END IF;

    -- cost_lyd is forbidden
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_services' AND column_name = 'cost_lyd') THEN
        ALTER TABLE medical_services DROP COLUMN cost_lyd;
    END IF;

    -- 2. Ease constraints on optional fields
    -- cost (internal only, not in contract core) -> make nullable if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_services' AND column_name = 'cost') THEN
        ALTER TABLE medical_services ALTER COLUMN cost DROP NOT NULL;
    END IF;

    -- base_price is optional in contract -> make nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_services' AND column_name = 'base_price') THEN
        ALTER TABLE medical_services ALTER COLUMN base_price DROP NOT NULL;
    END IF;

    -- 3. Verify description exists (redundant if V042 ran, but safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_services' AND column_name = 'description') THEN
        ALTER TABLE medical_services ADD COLUMN description TEXT;
    END IF;

END $$;
