
## 2026-06-15 - RoleManagementService N+1 Memory Bottleneck Resolution
**Learning:** In RBAC modules where the JPA relationship `User -> Role` is unidirectional and mapped on `User.roles`, fetching user counts per role or users by role via full table scans (`userRepository.findAll().stream().filter(...)`) creates massive memory overhead and N+1 database bottlenecks.
**Action:** Always prefer targeted bulk JPQL queries (e.g., `SELECT r.id, COUNT(u) FROM User u JOIN u.roles r WHERE r.id IN :roleIds GROUP BY r.id`) mapped into memory over iterative `findAll` loads, ensuring to check for empty collections before executing the `IN` query to prevent SQL syntax errors.
