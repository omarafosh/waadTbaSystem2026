-- ═══════════════════════════════════════════════════════════════════════════
-- V005: Family Members Table - PostgreSQL
-- TBA WAAD System - Policy-Free, Employer-Centric Architecture
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create family_members table for member dependents
-- Dependencies: V004 (members)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- FAMILY RELATIONSHIP ENUM
-- ───────────────────────────────────────────────────────────────────────────

CREATE TYPE family_relationship AS ENUM (
    'SPOUSE',
    'CHILD',
    'PARENT',
    'SIBLING',
    'OTHER'
);

-- ───────────────────────────────────────────────────────────────────────────
-- FAMILY MEMBERS TABLE
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE family_members (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    
    -- Personal information
    full_name_arabic VARCHAR(255) NOT NULL,
    full_name_english VARCHAR(255),
    civil_id VARCHAR(20),
    birth_date DATE,
    gender member_gender,
    
    -- Relationship
    relationship family_relationship NOT NULL,
    
    -- Coverage
    card_number VARCHAR(50),
    coverage_start DATE,
    coverage_end DATE,
    status member_status DEFAULT 'ACTIVE',
    
    -- Contact
    phone VARCHAR(30),
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_family_member FOREIGN KEY (member_id) 
        REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_family_members_member ON family_members(member_id);
CREATE INDEX idx_family_members_relationship ON family_members(relationship);
CREATE INDEX idx_family_members_status ON family_members(status);
CREATE INDEX idx_family_members_active ON family_members(active);
CREATE INDEX idx_family_members_card ON family_members(card_number);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V005
-- ═══════════════════════════════════════════════════════════════════════════
