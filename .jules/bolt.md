## 2026-05-19 - Removed in-memory filtering in RoleManagementService
**Learning:** `getUsersWithRole` and `countUsersWithRole` were doing full table scans of `User` (`findAll().stream()`) just to check for a single role.
**Action:** Created `findUsernamesByRolesId` and `countByRolesId` JPQL queries in `UserRepository` and replaced the in-memory filtering.
