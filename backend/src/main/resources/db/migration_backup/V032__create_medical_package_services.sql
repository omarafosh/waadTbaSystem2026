-- ═══════════════════════════════════════════════════════════════════════════
-- V032: Create Medical Package Services Join Table
-- TBA WAAD System - Medical Package to Service Many-to-Many Relationship
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Create join table for MedicalPackage <-> MedicalService relationship
-- Dependencies: V009 (medical_services, medical_packages)
-- ═══════════════════════════════════════════════════════════════════════════

-- Join table for many-to-many relationship between packages and services
CREATE TABLE IF NOT EXISTS medical_package_services (
    package_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    
    PRIMARY KEY (package_id, service_id),
    
    CONSTRAINT fk_mps_package FOREIGN KEY (package_id) 
        REFERENCES medical_packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_mps_service FOREIGN KEY (service_id) 
        REFERENCES medical_services(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mps_package ON medical_package_services(package_id);
CREATE INDEX IF NOT EXISTS idx_mps_service ON medical_package_services(service_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- END V032
-- ═══════════════════════════════════════════════════════════════════════════
