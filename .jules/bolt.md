## 2026-06-14 - PreAuth Service checkValidity Bottleneck Resolved
**Learning:** In-memory filtering of JPA entities using `findAll().stream().filter(...)` instead of native database queries causes O(N) memory load and network bottleneck for large datasets. This pattern was identified in `PreAuthorizationService.checkValidity()` and is a common performance issue when migrating from mock setups.
**Action:** Replaced `findAll()` with a targeted JPQL query `findValidPreAuthorizationsForCheckValidity` that uses `ORDER BY createdAt DESC` to fetch only the needed valid record directly from the DB.
