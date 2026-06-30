## 2026-06-30 - Fix N+1 database bottleneck and O(N) memory load in RoleManagementService

**Learning:** `getUsersWithRole` and `countUsersWithRole` in `RoleManagementService` were iterating over `userRepository.findAll().stream()`. Because this RBAC system does not explicitly map `Role.users` due to performance reasons (it's unidirectional `User.roles`), getting counts or lists of users per role was previously implemented using O(N) memory table-scans.
**Action:** Replace `findAll().stream().filter(...)` and map operations with bulk JPQL queries (`countByRolesId`, `findUsernamesByRolesId`) to push the work to the database, preventing O(N) heap allocations when users grow.

## 2026-06-30 - Fix N+1 mapping bottleneck in RoleManagementService.getAllRoles and searchRoles
**Learning:** `RoleManagementService.getAllRoles` and `searchRoles` use `toViewDto`, which in turn calls `countUsersWithRole`. Since `countUsersWithRole` was a single query per role, `getAllRoles` still caused N+1 database queries.
**Action:** Use a bulk `countUsersByRoleIds` using `GROUP BY r.id` map structure in memory during DTO conversion instead of querying `countUsersWithRole` in a loop.
