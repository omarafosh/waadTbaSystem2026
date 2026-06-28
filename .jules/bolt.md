## 2026-06-28 - Role Management Filtering Bottlenecks and N+1 Counting Opts
**Learning:** In RBAC modules where `User` -> `Role` is mapped but `Role` -> `User` is not explicitly mapped as a collection, iterative count queries inside mapping loops (e.g., inside `.map()`) can cause N+1 database bottlenecks.
**Action:** Use bulk JPA queries (e.g., `countUsersByRoleIds` using `GROUP BY r.id`) and map the results in memory. For fetching sub-fields (like usernames by role), use targeted JPQL `@Query` methods (`findUsernamesByRolesId`) to avoid full-table application memory loads.
