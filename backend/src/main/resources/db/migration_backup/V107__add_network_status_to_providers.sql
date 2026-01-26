-- V107: Add Network Status to Providers
-- Purpose: Add network tier classification for insurance providers (IN_NETWORK, OUT_OF_NETWORK, PREFERRED)
-- Author: System
-- Date: 2026-01-06

-- Add network_status column to providers table
ALTER TABLE providers
ADD COLUMN network_status VARCHAR(20);

-- Add comment explaining the column
COMMENT ON COLUMN providers.network_status IS 'Network tier: IN_NETWORK (معتمد داخل الشبكة), OUT_OF_NETWORK (خارج الشبكة), PREFERRED (مزود مفضل)';

-- Optional: Set default value for existing records (can be NULL for now)
-- UPDATE providers SET network_status = 'IN_NETWORK' WHERE active = true;
