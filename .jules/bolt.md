
## 2026-04-23 - Replace O(N) full-table role checks with O(1) JPQL counting
**Learning:** In Spring Data JPA, fetching the entire list of entities into memory to filter and count them via `findAll().stream().filter(...).count()` creates a critical O(N) memory and performance bottleneck, especially on large tables like Users. It can cause `OutOfMemoryError`.
**Action:** Always push counting, projection, and filtering logic down to the database using targeted JPQL queries (e.g., `countByRolesId`, `findUsernamesByRolesId`) to utilize database indexes and prevent unnecessary whole-table memory loads.
