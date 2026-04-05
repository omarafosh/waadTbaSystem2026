## 2024-04-05 - Avoid O(N) In-Memory Filtering on User Roles
**Learning:** `UserRepository.findAll().stream().filter(...)` was used to find users by role, causing the entire `User` table to be loaded into memory and mapped to Java objects just to count or map them.
**Action:** Use targeted `@Query` methods like `countByRolesId`, `findUsernamesByRolesId`, and `countByRolesName` in Spring Data JPA repositories to push counting and projection directly to the database.
