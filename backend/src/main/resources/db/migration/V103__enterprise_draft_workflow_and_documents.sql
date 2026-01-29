-- =============================================================================
-- V103: ENTERPRISE DRAFT WORKFLOW & DOCUMENT MANAGEMENT
-- =============================================================================

-- 1. Support for Extended Member Status Flow
-- Requirement 6: draft -> pending_verification -> active -> suspended
-- =============================================================================

-- Note: In PG, we check if the constraint exists before adding/modifying, 
-- or we can just add columns and handle status in Java as a string if using enums.
-- However, for robustness, we add a comment detailing the flow.

ALTER TABLE members 
    ADD COLUMN IF NOT EXISTS secondary_status VARCHAR(50); -- To handle workflow states without breaking legacy code

COMMENT ON COLUMN members.status IS 'ACTIVE, SUSPENDED, TERMINATED, PENDING, DRAFT, PENDING_VERIFICATION';

-- 2. Document Management Table (Requirement 5)
-- =============================================================================

CREATE TABLE IF NOT EXISTS member_documents (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- PHOTO, NATIONAL_ID, INSURANCE_CARD, CONTRACT, MEDICAL_DOC
    file_path VARCHAR(1000) NOT NULL,   -- Path in object storage
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    uploaded_by VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by VARCHAR(100),
    notes TEXT
);

COMMENT ON TABLE member_documents IS 'Requirement 5: Secure object storage references for insured documents';
COMMENT ON COLUMN member_documents.document_type IS 'PHOTO, NATIONAL_ID, INSURANCE_CARD, CONTRACT, MEDICAL_DOC, OTHER';

-- 3. Add Photo URL to Member for quick access (Reference)
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_photo_path VARCHAR(1000);
COMMENT ON COLUMN members.profile_photo_path IS 'Quick reference to the primary profile photo in member_documents';

-- 4. Temporary Record History (Requirement 6)
-- Track changes from Draft to Active
CREATE TABLE IF NOT EXISTS member_workflow_history (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by VARCHAR(100),
    reason TEXT
);

COMMENT ON TABLE member_workflow_history IS 'Requirement 6: Track transition from draft/pending to active status';
