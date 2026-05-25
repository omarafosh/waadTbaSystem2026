## 2026-05-25 - Resolved N+1 query and excessive memory filtering in RoleManagementService.getAllRoles()
**Learning:** `RoleManagementService.getAllRoles()` was fetching all roles, looping through each one, and calling `countUsersWithRole()` which resulted in querying and loading all users into memory for EACH role individually just to filter by role in Java. Also it resulted in a classic N+1 query issue.
**Action:** Replaced the loop-based querying with an aggregate query `countUsersByRoleIds` in `UserRepository` which returns a list of `Object[]` containing the `role_id` and the `count`. The service method was updated to retrieve all users grouped by role ID efficiently, storing counts in an in-memory Map to avoid iterative database queries.

## 2026-05-25 - Replaced stream filtering in RoleManagementService.getUsersWithRole() and countUsersWithRole()
**Learning:** `RoleManagementService.getUsersWithRole()` and `RoleManagementService.countUsersWithRole()` were fetching ALL users into memory (`userRepository.findAll()`) and filtering them using Java streams to check if they contained the requested role.
**Action:** Replaced stream filtering with targeted JPQL queries in `UserRepository`: `findUsernamesByRolesId` and `countByRolesId`. Pushing the filtering and projection to the database drastically reduces application memory overhead and database data transfer.
