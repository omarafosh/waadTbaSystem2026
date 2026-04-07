## 2026-04-07 - [Unidirectional Relationship in User-Role mapping]
**Learning:** In the RBAC module, the JPA relationship between `User` and `Role` is unidirectional from `User` (via `User.roles`). `Role` does not have a mapped `users` collection.
**Action:** When writing JPQL queries to group users by role, you must drive the query from the `User` entity (e.g., `SELECT r.id, COUNT(u) FROM User u JOIN u.roles r GROUP BY r.id`) rather than assuming a `r.users` collection exists on the `Role` side.
