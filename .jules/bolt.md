## 2026-03-15 - [Database Aggregation over Memory Streams]
**Learning:** In Spring Boot applications processing hundreds of records, grouping and aggregations should be performed directly in JPQL (`SUM(CASE WHEN...)`, `GROUP BY`) rather than calling `repository.findAll().stream()` to group in-memory. Doing so reduces Java heap pressure and improves query latency exponentially.
**Action:** Identify endpoints that pull large datasets directly into memory and rewrite the backend logic to rely on native database aggregation functionalities instead.
