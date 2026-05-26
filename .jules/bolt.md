## 2026-05-26 - Targeted PreAuthorization checkValidity Optimization
**Learning:** `PreAuthorizationService.checkValidity` contained a classic full-table in-memory filtering bottleneck, pulling all records from the database and using Java Streams to filter by `memberId`, `serviceCode`, `active` status, and `expiryDate`.
**Action:** Always replace `findAll().stream().filter(...)` patterns in service methods with targeted JPQL `@Query` methods or derived repository methods to offload filtering to the database, preventing O(N) memory loads and maximizing scalability.
