-- ═══════════════════════════════════════════════════════════════════════════
-- V1.08: Support Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. NOTIFICATIONS
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_user_id BIGINT NOT NULL,
    title VARCHAR(200),
    message TEXT,
    type VARCHAR(50), -- INFO, WARNING, ALERT
    reference_id VARCHAR(50), -- Link to Claim/Auth ID
    reference_type VARCHAR(50), -- CLAIM, PRE_AUTH
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP,
    
    CONSTRAINT fk_notif_user FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notif_user ON notifications(recipient_user_id);
CREATE INDEX idx_notif_unread ON notifications(recipient_user_id) WHERE is_read = FALSE;

-- 2. SYSTEM SETTINGS (Global Config)
-- Updated to match SystemSetting.java Entity
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'STRING' NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_editable BOOLEAN DEFAULT TRUE NOT NULL,
    default_value TEXT,
    validation_rules TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),

    CONSTRAINT uk_setting_key UNIQUE (setting_key)
);
