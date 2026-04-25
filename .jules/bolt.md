## 2024-05-20 - [Fixing Full-Table Scan in SuperAdmin Validation]
**Learning:** Found a full-table in-memory filtering bottleneck in `RbacGuardService.validateSuperAdminExists()` via `findAll().stream().filter(...).count()`.
**Action:** Replaced it with a database-level query `countByRoleName` in `UserRepository` and pushed the count evaluation after validating the conditions to avoid unnecessary DB queries if the modified user is not a SuperAdmin.
