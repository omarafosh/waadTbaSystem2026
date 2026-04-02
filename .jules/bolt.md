## 2026-04-02 - Optimize PreAuthDashboardService In-Memory Filtering

**Learning:** Replacing in-memory filtering (fetching all active PreAuths via `preAuthRepository.findAll().stream().filter(...)`) with a single efficient JPQL aggregation query dramatically reduces database load, network transfer, and memory footprint. Counting occurrences and summing properties directly in the database is far superior to pulling large object graphs into memory just to aggregate them.
**Action:** Always prefer pushing aggregate operations (COUNT, SUM) directly to the database level (JPQL or native queries) instead of resolving entities locally to filter and calculate values using Java streams.
