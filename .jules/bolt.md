
## 2026-03-22 - [Refactor `findAll().stream().filter(...)` with Relational ManyToMany mapping]
**Learning:** Found a major N+1 anti-pattern in `RoleManagementService.java` where `getUsersWithRole` and `countUsersWithRole` fetched the entire `users` table via `findAll()` and then performed an in-memory stream filter `user.getRoles().contains(role)` to identify matching records. This degrades heavily with ManyToMany mappings.
**Action:** Always replace in-memory Java Stream filtering in the service layer with DB-level filtering. Introduced `findByRolesContaining` and `countByRolesContaining` to `UserRepository` to leverage Spring Data JPA's generation.
