## 2026-04-04 - RbacGuardService Full Table Scan Anti-Pattern
**Learning:** Checking for the existence of critical roles (like SUPER_ADMIN) using `findAll().stream().filter(...)` causes an O(N) memory load of the entire `User` table, which degrades system stability during critical access checks.
**Action:** Always replace in-memory filtering on collections with targeted Spring Data JPA queries (e.g., `countByRolesName`) to push aggregations to the database level.
