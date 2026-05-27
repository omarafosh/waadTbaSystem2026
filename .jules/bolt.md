## 2026-05-27 - N+1 optimization in RoleManagementService

**Learning:** There is a known N+1 query performance bottleneck in `RoleManagementService.getAllRoles()` that should be resolved by fetching user counts in bulk via `countUsersByRoleIds` and using an in-memory map, eliminating the iterative `findById` and `countUsersWithRole` calls. Also applied the similar change to `getUsersWithRole` and `countUsersWithRole` to use targeted queries.
**Action:** Always check loop methods to fetch items using IDs instead of repetitive queries inside a loop or doing full table load.
