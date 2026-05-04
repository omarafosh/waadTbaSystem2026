## 2026-05-04 - Fix N+1 queries in RbacGuardService
**Learning:** The full-table scan bottleneck `userRepository.findAll().stream().filter(...)` can be solved in RBAC by pushing filtering to the database via `countByRolesName("SUPER_ADMIN")`.
**Action:** Always prefer pushing queries/aggregations to the database using JPQL rather than returning streams from `findAll()`.
