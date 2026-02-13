-- ═══════════════════════════════════════════════════════════════════════════
-- V1.23: Add Composite Index for Provider Service Date Range Queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Optimize provider reports and settlement generation
-- Queries like `findByProviderIdAndServiceDateBetween` and `findForSettlementReport`
-- filter by provider_id and a range of service_date.
-- A composite index on (provider_id, service_date) allows efficient range scans for a specific provider.

CREATE INDEX IF NOT EXISTS idx_claims_provider_service_date ON claims(provider_id, service_date);
