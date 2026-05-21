## 2024-05-21 - Optimize RbacGuardService validateSuperAdminExists memory loading
**Learning:** Found an O(N) memory leak anti-pattern in `RbacGuardService` using `userRepository.findAll().stream().filter(...).count()` to count Super Admins, reading the whole user table into memory.
**Action:** Always replace `findAll().stream().filter(...)` with database aggregation via Spring Data JPA JPQL queries (e.g. `@Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName")`) to process large tables safely and efficiently.
