## 2026-05-06 - Replaced In-Memory Mapping with Targeted DB Projection in JwtTokenProvider
**Learning:** Found an inefficient full-entity fetch via `findAll().stream()` in `JwtTokenProvider` that fetched the entire `Permission` table just to extract the `name` field in memory. This wastes memory and network resources, particularly as the permissions list grows.
**Action:** Replaced the full-entity fetch with a targeted JPA projection `@Query("SELECT p.name FROM Permission p")` to push the selection logic to the database and retrieve only the necessary column.
