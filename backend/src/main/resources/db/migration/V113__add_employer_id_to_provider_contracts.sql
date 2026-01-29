-- Add employer_id column to provider_contracts table
ALTER TABLE provider_contracts 
ADD COLUMN IF NOT EXISTS employer_id BIGINT;

-- Add index for employer_id
CREATE INDEX IF NOT EXISTS idx_contracts_employer_id ON provider_contracts(employer_id);

-- Add foreign key constraint to employers table
-- Note: Using correct constraint name pattern
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_provider_contracts_employer') THEN
        ALTER TABLE provider_contracts
        ADD CONSTRAINT fk_provider_contracts_employer
        FOREIGN KEY (employer_id) REFERENCES employers(id);
    END IF;
END $$;
