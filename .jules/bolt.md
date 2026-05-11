## 2026-01-28 - JwtTokenProvider Full-Table Memory Mapping Optimization
**Learning:** Extracting list of entity names via `findAll().stream().map(Entity::getName)` triggers a full entity load causing unnecessary database fetch and memory allocation, specially in authentication flows (like generating JWT tokens) that are called frequently.
**Action:** Always verify if only specific fields are required. If so, use JPQL Projection (e.g. `@Query("SELECT p.name FROM Permission p")`) to fetch only those necessary columns and offload logic directly to the database.
