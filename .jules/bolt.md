
## 2026-03-26 - [Backend] Optimize RoleManagementService countUsersWithRole & getUsersWithRole
**Learning:** Found an N+1 and OOM risk in `RoleManagementService` where it was calling `userRepository.findAll().stream()` to find and count users by role. This fetched all users into memory for filtering.
**Action:** Replaced in-memory streaming with explicit JPQL queries (`findUsernamesByRoleId` and `countByRolesId`) in `UserRepository`. Kept the initial `roleRepository.findById(roleId)` check to maintain the `ResourceNotFoundException` behavior for invalid roles. Always look for `.findAll().stream()` in services as candidates for database-level query optimization.
