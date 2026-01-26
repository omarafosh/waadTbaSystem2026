-- ═══════════════════════════════════════════════════════════════════════════
-- V022: Add Missing Columns to benefit_policy_rules Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add columns required by BenefitPolicyRule JPA Entity
-- Fixes: Schema-validation: missing column [amount_limit] in table [benefit_policy_rules]
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add amount_limit column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS amount_limit DECIMAL(15,2);

-- 2. Add coverage_percent column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS coverage_percent INTEGER;

-- 3. Add times_limit column  
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS times_limit INTEGER;

-- 4. Add waiting_period_days column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS waiting_period_days INTEGER DEFAULT 0;

-- 5. Add requires_pre_approval column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS requires_pre_approval BOOLEAN DEFAULT FALSE;

-- 6. Add notes column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS notes VARCHAR(500);

-- 7. Add medical_category_id FK column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS medical_category_id BIGINT;

-- 8. Add medical_service_id FK column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS medical_service_id BIGINT;

-- 9. Add created_at column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 10. Add updated_at column
ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 11. Add Foreign Key constraints (only if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bpr_category') THEN
        ALTER TABLE benefit_policy_rules 
        ADD CONSTRAINT fk_bpr_category FOREIGN KEY (medical_category_id) REFERENCES medical_categories(id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bpr_service') THEN
        ALTER TABLE benefit_policy_rules 
        ADD CONSTRAINT fk_bpr_service FOREIGN KEY (medical_service_id) REFERENCES medical_services(id);
    END IF;
END $$;

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bpr_medical_category ON benefit_policy_rules(medical_category_id);
CREATE INDEX IF NOT EXISTS idx_bpr_medical_service ON benefit_policy_rules(medical_service_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V022
-- ═══════════════════════════════════════════════════════════════════════════
