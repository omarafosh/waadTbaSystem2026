## 2026-05-27 - Resolved full-table in-memory filtering in RbacGuardService.validateSuperAdminExists
**Learning:** `RbacGuardService.validateSuperAdminExists` previously loaded the entire `users` table into memory using `findAll().stream().filter(...)` to count SUPER_ADMIN users, creating an O(N) memory bottleneck for large datasets.
**Action:** Replaced with a targeted `countByRoleName` query in `UserRepository` to push the computation to the database, changing it from an O(N) application memory operation to an O(1) query.
