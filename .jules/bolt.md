## 2026-04-03 - Pre-Auth Memory Filtering Bottleneck
**Learning:** Avoid using `repository.findAll().stream().filter(...)` in Spring service layers for data filtering (e.g. `PreAuthorizationService.checkValidity()`). This loads the entire table into memory, creating an O(N) memory bottleneck and severe performance degradation as the table grows.
**Action:** Always push filtering and sorting down to the database level using targeted JPQL `@Query` methods or Spring Data derived queries to prevent whole-table memory loads.
