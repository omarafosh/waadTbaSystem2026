-- Add encounter_type to benefit_policy_rules
-- This allows different coverage rules for the same service based on visit type (OPD, ER, IPD)

ALTER TABLE benefit_policy_rules ADD COLUMN IF NOT EXISTS encounter_type VARCHAR(30);

-- Drop old unique constraints safely (names vary depending on which migration or Hibernate created them)
ALTER TABLE benefit_policy_rules DROP CONSTRAINT IF EXISTS uk_bpr_policy_category;
ALTER TABLE benefit_policy_rules DROP CONSTRAINT IF EXISTS uk_bpr_policy_service;
ALTER TABLE benefit_policy_rules DROP CONSTRAINT IF EXISTS uq_benefit_plan_category_service;
ALTER TABLE benefit_policy_rules DROP CONSTRAINT IF EXISTS benefit_policy_rules_benefit_policy_id_medical_category_id_key;
ALTER TABLE benefit_policy_rules DROP CONSTRAINT IF EXISTS benefit_policy_rules_benefit_policy_id_medical_service_id_key;

-- Create new unique constraints including encounter_type
-- Note: NULL in encounter_type means it applies to ALL encounter types unless a specific one exists
ALTER TABLE benefit_policy_rules ADD CONSTRAINT uk_bpr_policy_category_context 
    UNIQUE (benefit_policy_id, medical_category_id, encounter_type);

ALTER TABLE benefit_policy_rules ADD CONSTRAINT uk_bpr_policy_service_context 
    UNIQUE (benefit_policy_id, medical_service_id, encounter_type);

-- Add index for performance
CREATE INDEX idx_bpr_encounter_type ON benefit_policy_rules (encounter_type);
