-- Migration V112: Add User Company Permissions
-- Description: Adds fields to restrict provider users to specific companies

-- 1. Add allow_all_companies to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_all_companies BOOLEAN DEFAULT TRUE;

-- 2. Create join table for specific permitted companies
CREATE TABLE IF NOT EXISTS user_permitted_companies (
    user_id BIGINT NOT NULL,
    employer_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, employer_id),
    CONSTRAINT fk_user_permitted FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_employer_permitted FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
);

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_user_permitted_companies_user ON user_permitted_companies(user_id);
