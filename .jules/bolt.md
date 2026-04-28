## 2026-04-28 - [Resolved Full-Table Memory Leak in PreAuthorizationService checkValidity]
**Learning:** Found an N+1/full-table filtering anti-pattern in `PreAuthorizationService.checkValidity` where `findAll().stream()` was loading every pre-authorization in the system into memory before filtering for a specific member and service combination.
**Action:** Always replace `findAll().stream().filter(...)` operations with targeted Spring Data JPA `@Query` methods using indexed parameters (like `memberId`, `serviceCode`, etc) and sorting directly at the DB level.
