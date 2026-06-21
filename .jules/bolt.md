
## 2025-02-14 - Optimized RoleManagementService
**Learning:** Found N+1 counting problem and full table fetching bottleneck via `findAll().stream()` operations inside loops. Using JPA with `GROUP BY` avoids executing an N+1 set of count queries or loading the whole table in memory, significantly speeding up list fetching methods.
**Action:** Replaced `.findAll().stream()` with direct database queries `countByRolesId`, `findUsernamesByRolesId`, and a batched `countUsersByRoleIds`.
