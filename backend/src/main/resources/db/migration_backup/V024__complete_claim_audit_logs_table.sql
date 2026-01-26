-- ═══════════════════════════════════════════════════════════════════════════
-- V024: Complete claim_audit_logs Table for ClaimAuditLog Entity
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add all columns required by ClaimAuditLog JPA Entity
-- Fixes: Schema-validation: missing column [actor_role] in table [claim_audit_logs]
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the simple table from V020 and recreate with full structure
DROP TABLE IF EXISTS claim_audit_logs CASCADE;

CREATE TABLE claim_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Reference to claim
    claim_id BIGINT NOT NULL,
    
    -- Change type enum
    change_type VARCHAR(50) NOT NULL,
    
    -- Status change tracking
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    
    -- Amount change tracking
    previous_requested_amount DECIMAL(15,2),
    new_requested_amount DECIMAL(15,2),
    previous_approved_amount DECIMAL(15,2),
    new_approved_amount DECIMAL(15,2),
    
    -- Actor information
    actor_user_id BIGINT NOT NULL,
    actor_username VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    
    -- Timestamp
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional context
    comment TEXT,
    ip_address VARCHAR(45),
    before_snapshot TEXT,
    after_snapshot TEXT,
    
    -- Foreign key to claims table
    CONSTRAINT fk_claim_audit_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_claim_audit_claim_id ON claim_audit_logs(claim_id);
CREATE INDEX idx_claim_audit_timestamp ON claim_audit_logs(timestamp);
CREATE INDEX idx_claim_audit_actor ON claim_audit_logs(actor_user_id);
CREATE INDEX idx_claim_audit_change_type ON claim_audit_logs(change_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V024
-- ═══════════════════════════════════════════════════════════════════════════
