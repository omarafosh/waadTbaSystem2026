## 2026-06-13 - O(N) In-Memory Bottlenecks to JPQL Batch Queries
**Learning:** Iterating through all users to count roles or map DTOs inside a loop causes a massive N+1 query issue and memory consumption. A single JPQL query with a `GROUP BY` clause can aggregate all required data at once.
**Action:** Replace `repository.findAll().stream().filter(...)` with database-level JPQL aggregation queries. Use a bulk lookup (e.g., `countUsersByRoleIds`) and map the result to an in-memory `Map` before iterating to achieve O(1) performance.
