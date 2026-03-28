## 2026-03-28 - Eliminate In-Memory Filtering for Relationship Counts and Mapping
**Learning:** Avoid using `repository.findAll().stream().filter(...)` in service layers just to check if relationships exist or to map sub-fields (like usernames). This loads massive lists of unneeded objects into memory and causes N+1 queries.
**Action:** Always create targeted `@Query` methods (e.g. `countByRolesId` or `findUsernamesByRolesId`) to push projection and counting directly to the database.
