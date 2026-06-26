## 2026-06-26 - PreAuthorizationService Full Table Scan Bottleneck
**Learning:** `PreAuthorizationService.checkValidity()` suffered from a massive full-table scan, fetching every pre-authorization record into application memory to filter out valid ones for a single member and service code, causing O(N) memory consumption and latency.
**Action:** Always replace O(N) `repository.findAll().stream().filter(...)` operations in Spring services with targeted JPQL `@Query` methods to push filtering, ordering, and limiting (`PageRequest`) directly to the database.
