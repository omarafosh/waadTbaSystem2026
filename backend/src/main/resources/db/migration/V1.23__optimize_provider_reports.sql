-- ═══════════════════════════════════════════════════════════════════════════
-- V1.23: Provider Report Optimization
-- ═══════════════════════════════════════════════════════════════════════════

-- Optimize Provider Invoice PDF Reports & Settlement Reports
-- Query pattern: provider_id = ? AND service_date BETWEEN ? AND ?
-- Existing indexes (provider_id) or (service_date) or (provider_id, status) are insufficient
-- for date range queries filtered by provider (as service_date is not in the composite index or is last).

-- This index allows direct seeking to a provider's claims and range scan on service_date,
-- significantly improving performance for date-filtered reports.
CREATE INDEX IF NOT EXISTS idx_claims_provider_service_date ON claims(provider_id, service_date);
