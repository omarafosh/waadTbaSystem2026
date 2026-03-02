
## 2026-03-02 - Eliminate N+1 Queries in Coverage Batch Service
**Learning:** `BenefitPolicyCoverageService.batchGetCoveragePercents` executed an iterative N+1 query pattern by resolving effective coverage percentage individually per service in a loop.
**Action:** Always batch fetch dependent entities and applicable rules for a collection of primary entities, then resolve the business logic (like hierarchical coverage priority: Service > Category > Default) in-memory using Maps and optimized rule matching to reduce database round-trips.
