## 2024-05-18 - RoleManagementService N+1 Optimization
**Learning:** Optimizing `RoleManagementService.getAllRoles()` requires batch fetching user counts by role. Because the `Role` entity does not have a mapped `users` collection, the JPQL query must drive from the `User` entity (e.g. `SELECT r.id, COUNT(u) FROM User u JOIN u.roles r WHERE r.id IN :roleIds GROUP BY r.id`).
**Action:** Always check the entity mappings before writing JPQL queries for join counting, especially in unidirectional relationships.
