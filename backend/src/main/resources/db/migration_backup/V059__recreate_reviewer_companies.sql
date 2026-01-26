-- ═══════════════════════════════════════════════════════════════════════════
-- V059: Recreate Reviewer Companies Table
-- TBA WAAD System - Schema Alignment
-- ═══════════════════════════════════════════════════════════════════════════
-- The Entity has different structure than the original table

DROP TABLE IF EXISTS reviewer_companies CASCADE;

CREATE TABLE reviewer_companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    medical_director VARCHAR(200),
    phone VARCHAR(50),
    email VARCHAR(200),
    address VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V059
-- ═══════════════════════════════════════════════════════════════════════════
