## 2026-04-03 - [Role Management Performance Optimization]
**Learning:** Found a full-table scanning pattern in `RoleManagementService` and `RbacGuardService` where checking roles was done by fetching all users (`findAll().stream()`) and filtering them in-memory.
**Action:** Replaced these in-memory scans with database-level counting and targeted projections in `UserRepository` (`countByRolesId`, `findUsernamesByRolesId`, `countByRolesName`), drastically reducing memory overhead and improving query performance for role administration.
