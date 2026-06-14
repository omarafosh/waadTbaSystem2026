## 2026-01-28 - Replace findAll().stream().filter(...) with Targeted JPQL in PreAuthorizationService
**Learning:** The codebase previously loaded the entire `PreAuthorization` table into memory to filter valid pre-authorizations for a specific member and service, creating a severe O(N) performance bottleneck and memory strain.
**Action:** Always replace `findAll().stream().filter(...)` with targeted JPQL queries or Spring Data derived queries (like `findValidPreAuthsByMemberAndService`) to push filtering and sorting to the database level, ensuring O(1) retrieval times.
