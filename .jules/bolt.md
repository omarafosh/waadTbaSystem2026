## 2026-06-05 - Fix Pre-Authorization Service O(N) memory load bottleneck
**Learning:** The `checkValidity` method in `PreAuthorizationService` previously loaded the entire table into application memory to filter via streams, leading to O(N) full-table data transfer. The optimization shifted this to a targeted JPQL query (`findValidForMemberAndService`).
**Action:** Use targeted JPQL `@Query` methods instead of `repository.findAll().stream().filter(...)` in Spring service layers to push filtering to the database.
