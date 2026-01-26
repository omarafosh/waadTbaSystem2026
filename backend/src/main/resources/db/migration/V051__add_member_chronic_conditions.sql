-- ============================================================================
-- V051__add_member_chronic_conditions.sql
-- Add chronic condition management for members
-- ============================================================================

-- Create table for member chronic conditions
DROP TABLE IF EXISTS member_chronic_conditions CASCADE;
CREATE TABLE member_chronic_conditions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign Keys
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Condition Information
    condition_type VARCHAR(50) NOT NULL,
    custom_condition_name VARCHAR(255),
    icd10_code VARCHAR(20),
    diagnosis_date DATE,
    disclosure_date DATE,
    severity_level INTEGER DEFAULT 3,
    
    -- Coverage Information
    coverage_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
    coverage_status_changed_at TIMESTAMP,
    waiting_period_days INTEGER,
    waiting_period_end_date DATE,
    coverage_percentage DECIMAL(5,2),
    annual_limit DECIMAL(15,2),
    used_amount DECIMAL(15,2) DEFAULT 0,
    coverage_reason TEXT,
    
    -- Documentation
    documentation_path VARCHAR(500),
    documentation_verified BOOLEAN DEFAULT FALSE,
    verification_date DATE,
    verified_by VARCHAR(100),
    diagnosing_physician VARCHAR(255),
    diagnosing_facility VARCHAR(255),
    
    -- Treatment Information
    current_medications TEXT,
    treatment_plan TEXT,
    last_review_date DATE,
    next_review_date DATE,
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    resolved_date DATE,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP,
    last_modified_by VARCHAR(100),
    
    -- Constraints
    CONSTRAINT chk_severity_level CHECK (severity_level BETWEEN 1 AND 5),
    CONSTRAINT chk_coverage_percentage CHECK (coverage_percentage IS NULL OR (coverage_percentage >= 0 AND coverage_percentage <= 100)),
    CONSTRAINT chk_used_amount CHECK (used_amount >= 0),
    CONSTRAINT uk_member_condition_type UNIQUE (member_id, condition_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chronic_member_id ON member_chronic_conditions(member_id);
CREATE INDEX IF NOT EXISTS idx_chronic_condition_type ON member_chronic_conditions(condition_type);
CREATE INDEX IF NOT EXISTS idx_chronic_coverage_status ON member_chronic_conditions(coverage_status);
CREATE INDEX IF NOT EXISTS idx_chronic_active ON member_chronic_conditions(active);
CREATE INDEX IF NOT EXISTS idx_chronic_waiting_period ON member_chronic_conditions(waiting_period_end_date) 
    WHERE coverage_status = 'WAITING_PERIOD';
CREATE INDEX IF NOT EXISTS idx_chronic_pending_review ON member_chronic_conditions(created_at) 
    WHERE coverage_status = 'PENDING_REVIEW';
CREATE INDEX IF NOT EXISTS idx_chronic_verification ON member_chronic_conditions(documentation_verified, verification_date);

-- Add comments
COMMENT ON TABLE member_chronic_conditions IS 'إدارة الأمراض المزمنة للأعضاء - Chronic conditions management for members';
COMMENT ON COLUMN member_chronic_conditions.condition_type IS 'نوع المرض المزمن من القائمة المحددة';
COMMENT ON COLUMN member_chronic_conditions.coverage_status IS 'حالة التغطية: COVERED, EXCLUDED, WAITING_PERIOD, PARTIAL, PENDING_REVIEW, etc.';
COMMENT ON COLUMN member_chronic_conditions.waiting_period_days IS 'فترة الانتظار بالأيام قبل بدء التغطية';
COMMENT ON COLUMN member_chronic_conditions.annual_limit IS 'الحد السنوي الأقصى للمطالبات المتعلقة بهذا المرض';
COMMENT ON COLUMN member_chronic_conditions.used_amount IS 'المبلغ المستخدم من الحد السنوي';
COMMENT ON COLUMN member_chronic_conditions.severity_level IS 'مستوى خطورة الحالة من 1 (خفيف) إلى 5 (حرج)';

-- Insert sample chronic conditions for testing (optional - can be removed in production)
-- This is commented out - uncomment if you want test data
/*
INSERT INTO member_chronic_conditions (member_id, condition_type, diagnosis_date, disclosure_date, coverage_status, severity_level)
SELECT 
    m.id,
    'DIABETES_TYPE_2',
    CURRENT_DATE - INTERVAL '2 years',
    CURRENT_DATE - INTERVAL '1 year',
    'COVERED',
    3
FROM members m
WHERE m.id IN (SELECT id FROM members ORDER BY id LIMIT 5);
*/

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_chronic_conditions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chronic_conditions_updated_at ON member_chronic_conditions;
CREATE TRIGGER trg_chronic_conditions_updated_at
    BEFORE UPDATE ON member_chronic_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_chronic_conditions_updated_at();
