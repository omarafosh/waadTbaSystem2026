## 2024-05-15 - BenefitPolicyCoverageService N+1 Query Fix
**Learning:** `BenefitPolicyCoverageService.batchGetCoveragePercents` iterated over service IDs, executing the full coverage resolution query per ID, leading to an N+1 query vulnerability during batch processing operations.
**Action:** Replicate the database `ORDER BY CASE` precedence logic (service vs category match, exact encounter vs null encounter match) in-memory after using an `IN` clause to batch fetch the potential rules and services upfront. Always guard `IN` clauses from being empty to prevent JPA syntax errors.
