CREATE TABLE IF NOT EXISTS provider_documents (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    document_number VARCHAR(100),
    expiry_date DATE,
    notes VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_provider_docs_provider 
        FOREIGN KEY (provider_id) 
        REFERENCES providers(id)
);

CREATE INDEX idx_provider_docs_provider_id ON provider_documents(provider_id);
