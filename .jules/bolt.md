## 2026-06-01 - [Resolve RoleManagementService In-Memory Bottleneck]
**Learning:** For counting relationships or projecting specific fields (like username) from an entity related by an ID, avoiding full-table queries into memory streams (via `findAll().stream()`) provides massive performance improvements. Spring Data `@Query` is a very useful way to push that to the database.
**Action:** Use specific `@Query` projections (e.g. `countUsersByRoleId`, `findUsernamesByRoleId`) instead of application-side stream filtering.
