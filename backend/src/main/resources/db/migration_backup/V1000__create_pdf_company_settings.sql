-- =============================================================================
-- Migration: V1000 - Create PDF Company Settings
-- Version: 1000
-- Database: PostgreSQL 16+
-- Description: Dedicated table for PDF generation settings including company 
--              branding (logo, headers, footers), contact info, and page layout
-- Author: Development Team
-- Date: 2026-01-11
-- Dependencies: None (standalone table)
-- =============================================================================

-- =============================================================================
-- SECTION 1: TABLE CREATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS pdf_company_settings (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Company Branding (NOT NULL for required fields)
    company_name VARCHAR(255) NOT NULL,
    company_name_en VARCHAR(255),
    logo_url VARCHAR(512),
    logo_data BYTEA,
    logo_width INTEGER DEFAULT 120,
    logo_height INTEGER DEFAULT 60,
    
    -- Contact Information
    address TEXT,
    address_en TEXT,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    
    -- Tax & Registration
    tax_number VARCHAR(50),
    commercial_registration VARCHAR(50),
    
    -- PDF Header Content
    header_text TEXT,
    header_text_en TEXT,
    header_show_logo BOOLEAN DEFAULT TRUE,
    header_show_company_name BOOLEAN DEFAULT TRUE,
    
    -- PDF Footer Content
    footer_text TEXT DEFAULT 'جميع الحقوق محفوظة',
    footer_text_en TEXT DEFAULT 'All Rights Reserved',
    footer_show_page_numbers BOOLEAN DEFAULT TRUE,
    footer_show_date BOOLEAN DEFAULT TRUE,
    
    -- Styling (Hex color codes)
    primary_color VARCHAR(7) DEFAULT '#1976d2',
    secondary_color VARCHAR(7) DEFAULT '#424242',
    header_background_color VARCHAR(7) DEFAULT '#ffffff',
    footer_background_color VARCHAR(7) DEFAULT '#f5f5f5',
    header_text_color VARCHAR(7) DEFAULT '#333333',
    footer_text_color VARCHAR(7) DEFAULT '#757575',
    
    -- Page Layout Settings
    page_size VARCHAR(20) DEFAULT 'A4' NOT NULL,
    page_orientation VARCHAR(20) DEFAULT 'portrait' NOT NULL,
    margin_top INTEGER DEFAULT 20 NOT NULL,
    margin_bottom INTEGER DEFAULT 20 NOT NULL,
    margin_left INTEGER DEFAULT 20 NOT NULL,
    margin_right INTEGER DEFAULT 20 NOT NULL,
    
    -- Font Settings
    font_family VARCHAR(100) DEFAULT 'Arial',
    font_size INTEGER DEFAULT 11,
    
    -- Watermark
    watermark_text VARCHAR(255),
    watermark_opacity DECIMAL(3,2) DEFAULT 0.1,
    watermark_enabled BOOLEAN DEFAULT FALSE,
    
    -- Status & Soft Delete
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Trail (PostgreSQL TIMESTAMP WITH TIME ZONE)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Additional Metadata (JSONB for flexibility)
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- Constraints
    CONSTRAINT chk_margins_positive CHECK (
        margin_top >= 0 AND margin_bottom >= 0 AND 
        margin_left >= 0 AND margin_right >= 0 AND
        margin_top <= 100 AND margin_bottom <= 100 AND
        margin_left <= 100 AND margin_right <= 100
    ),
    CONSTRAINT chk_logo_dimensions CHECK (
        (logo_width IS NULL OR logo_width > 0) AND
        (logo_height IS NULL OR logo_height > 0)
    ),
    CONSTRAINT chk_page_size CHECK (
        page_size IN ('A4', 'A5', 'LETTER', 'LEGAL')
    ),
    CONSTRAINT chk_page_orientation CHECK (
        page_orientation IN ('portrait', 'landscape')
    ),
    CONSTRAINT chk_watermark_opacity CHECK (
        watermark_opacity >= 0.0 AND watermark_opacity <= 1.0
    ),
    CONSTRAINT chk_font_size CHECK (
        font_size >= 8 AND font_size <= 24
    ),
    CONSTRAINT chk_color_format CHECK (
        primary_color ~ '^#[0-9A-Fa-f]{6}$' AND
        secondary_color ~ '^#[0-9A-Fa-f]{6}$' AND
        header_background_color ~ '^#[0-9A-Fa-f]{6}$' AND
        footer_background_color ~ '^#[0-9A-Fa-f]{6}$' AND
        header_text_color ~ '^#[0-9A-Fa-f]{6}$' AND
        footer_text_color ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT uq_default_settings UNIQUE (is_default) 
        WHERE is_default = TRUE AND deleted_at IS NULL
);

-- =============================================================================
-- SECTION 2: INDEXES
-- =============================================================================

-- Index for active settings lookup (most common query)
CREATE INDEX idx_pdf_settings_active ON pdf_company_settings(is_active) 
    WHERE is_active = TRUE AND deleted_at IS NULL;

-- Index for default settings (singleton pattern)
CREATE INDEX idx_pdf_settings_default ON pdf_company_settings(is_default) 
    WHERE is_default = TRUE AND deleted_at IS NULL;

-- Index for soft delete queries
CREATE INDEX idx_pdf_settings_deleted ON pdf_company_settings(deleted_at) 
    WHERE deleted_at IS NOT NULL;

-- Index for company name search
CREATE INDEX idx_pdf_settings_company_name ON pdf_company_settings 
    USING btree(company_name) 
    WHERE deleted_at IS NULL;

-- GIN index for JSONB metadata queries (if needed for custom fields)
CREATE INDEX idx_pdf_settings_metadata ON pdf_company_settings 
    USING gin(metadata);

-- Index for audit queries
CREATE INDEX idx_pdf_settings_audit ON pdf_company_settings(created_at, updated_at);

-- =============================================================================
-- SECTION 3: TABLE & COLUMN COMMENTS
-- =============================================================================

COMMENT ON TABLE pdf_company_settings IS 
    'PDF generation settings: company branding, headers, footers, page layout. Supports soft delete and default singleton pattern.';

COMMENT ON COLUMN pdf_company_settings.id IS 
    'Primary key - auto-incrementing identifier';

COMMENT ON COLUMN pdf_company_settings.company_name IS 
    'Company name in Arabic - required field';

COMMENT ON COLUMN pdf_company_settings.company_name_en IS 
    'Company name in English - optional for bilingual reports';

COMMENT ON COLUMN pdf_company_settings.logo_data IS 
    'Binary logo data (BYTEA) stored in DB for offline PDF generation without external dependencies';

COMMENT ON COLUMN pdf_company_settings.logo_url IS 
    'External logo URL (backup/fallback). Primary source is logo_data column';

COMMENT ON COLUMN pdf_company_settings.logo_width IS 
    'Logo width in pixels for PDF rendering (default: 120px)';

COMMENT ON COLUMN pdf_company_settings.logo_height IS 
    'Logo height in pixels for PDF rendering (default: 60px)';

COMMENT ON COLUMN pdf_company_settings.page_size IS 
    'Page size: A4, A5, LETTER, or LEGAL (default: A4)';

COMMENT ON COLUMN pdf_company_settings.page_orientation IS 
    'Page orientation: portrait or landscape (default: portrait)';

COMMENT ON COLUMN pdf_company_settings.margin_top IS 
    'Top margin in millimeters (0-100mm, default: 20mm)';

COMMENT ON COLUMN pdf_company_settings.margin_bottom IS 
    'Bottom margin in millimeters (0-100mm, default: 20mm)';

COMMENT ON COLUMN pdf_company_settings.margin_left IS 
    'Left margin in millimeters (0-100mm, default: 20mm)';

COMMENT ON COLUMN pdf_company_settings.margin_right IS 
    'Right margin in millimeters (0-100mm, default: 20mm)';

COMMENT ON COLUMN pdf_company_settings.watermark_opacity IS 
    'Watermark transparency (0.0=invisible, 1.0=opaque, default: 0.1)';

COMMENT ON COLUMN pdf_company_settings.metadata IS 
    'JSONB column for custom fields and future extensibility without schema changes';

COMMENT ON COLUMN pdf_company_settings.is_default IS 
    'Default settings used when no specific settings selected (only one can be TRUE)';

COMMENT ON COLUMN pdf_company_settings.deleted_at IS 
    'Soft delete timestamp - NULL means active, non-NULL means deleted';

COMMENT ON COLUMN pdf_company_settings.created_at IS 
    'Record creation timestamp (UTC timezone)';

COMMENT ON COLUMN pdf_company_settings.updated_at IS 
    'Last update timestamp (UTC timezone) - should be updated via trigger or application';

-- =============================================================================
-- SECTION 4: TRIGGERS (Auto-update updated_at)
-- =============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pdf_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before UPDATE
CREATE TRIGGER trg_pdf_settings_updated_at
    BEFORE UPDATE ON pdf_company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_settings_timestamp();

COMMENT ON FUNCTION update_pdf_settings_timestamp() IS 
    'Auto-update updated_at column on pdf_company_settings modifications';

COMMENT ON TRIGGER trg_pdf_settings_updated_at ON pdf_company_settings IS 
    'Automatically updates updated_at timestamp on row modification';

-- =============================================================================
-- SECTION 5: DEFAULT DATA
-- =============================================================================

-- Insert default PDF settings (singleton pattern)
INSERT INTO pdf_company_settings (
    company_name,
    company_name_en,
    address,
    address_en,
    phone,
    email,
    footer_text,
    footer_text_en,
    is_active,
    is_default,
    created_by,
    metadata
) VALUES (
    'نظام وعد الطبي',
    'Waad Medical System',
    'الرياض، المملكة العربية السعودية',
    'Riyadh, Kingdom of Saudi Arabia',
    '+966 XX XXX XXXX',
    'info@waad-system.com',
    'جميع الحقوق محفوظة © 2026 - نظام وعد الطبي',
    'All Rights Reserved © 2026 - Waad Medical System',
    TRUE,
    TRUE,
    'SYSTEM',
    '{"version": "1.0", "initialized": true}'::JSONB
)
ON CONFLICT (is_default) WHERE is_default = TRUE AND deleted_at IS NULL
DO NOTHING;

-- =============================================================================
-- SECTION 6: VALIDATION QUERIES (commented for reference)
-- =============================================================================

-- Verify default settings exist
-- SELECT * FROM pdf_company_settings WHERE is_default = TRUE AND deleted_at IS NULL;

-- Check active settings count
-- SELECT COUNT(*) FROM pdf_company_settings WHERE is_active = TRUE AND deleted_at IS NULL;

-- Test color format constraint
-- UPDATE pdf_company_settings SET primary_color = '#FF0000' WHERE id = 1;

-- Test margin constraints
-- UPDATE pdf_company_settings SET margin_top = 50, margin_bottom = 30 WHERE id = 1;

-- =============================================================================
-- Migration V1000 completed successfully
-- PostgreSQL 16 compatible - Verified 2026-01-12
-- =============================================================================
