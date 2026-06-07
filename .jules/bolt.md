
## 2026-06-07 - Resolve Role Management N+1 and Memory Filtering Bottleneck
**Learning:** Found an extreme N+1 and memory bottleneck in `RoleManagementService.getAllRoles` where it was doing a `findAll()` loop and then for *each role* doing a `userRepository.findAll().stream().filter(...)` full table load to count users.
**Action:** Replaced stream filtering with targeted JPQL queries (`countByRolesId`, `findUsernamesByRolesId`). Fixed the N+1 loop by fetching a batched `List<Object[]>` with `GROUP BY r.id` and building a Map. Always check for empty collections before `IN` clauses to prevent SQL errors.
