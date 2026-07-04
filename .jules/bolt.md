
## 2026-07-04 - Eliminate N+1 Database Queries in RoleManagementService mapping
**Learning:** In RBAC modules where User -> Role is mapped but Role -> User is not explicitly mapped as a collection, avoid using iterative count queries inside mapping loops (e.g., inside `.map()`). Instead, use bulk JPA queries (e.g., `countUsersByRoleIds` using `GROUP BY r.id`) and map the results in memory to eliminate N+1 database bottlenecks.
**Action:** When mapping lists of entities to DTOs that require aggregates from related tables, always check if a batched `@Query` can pre-fetch the required data into a Java `Map` for O(1) lookup during the streaming process.
