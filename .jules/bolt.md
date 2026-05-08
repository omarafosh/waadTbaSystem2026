## 2024-05-08 - Resolve full-table fetch in RbacGuardService

**Learning:** The `validateSuperAdminExists` method in `RbacGuardService` uses an O(N) full-table fetch via `userRepository.findAll().stream().filter(...)` just to count the number of users with the "SUPER_ADMIN" role. This loads all user entities into memory, which scales poorly. Although a previous memory entry claimed `countByRolesName` was implemented in `UserRepository` to resolve this, the codebase search showed it is actually missing.
**Action:** Implement `countByRolesName(String roleName)` in `UserRepository` and update `RbacGuardService.validateSuperAdminExists` to use it instead of `findAll().stream()`.
