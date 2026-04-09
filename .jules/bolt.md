## 2026-04-09 - [Resolved N+1 and memory overhead in RoleManagementService]
**Learning:** `RoleManagementService` `getAllRoles` and `searchRoles` used an N+1 pattern by repeatedly querying for users counts.
**Action:** Replaced loop queries with a single query utilizing `countUsersGroupedByRole()` to map role IDs to user counts in a `HashMap`.
