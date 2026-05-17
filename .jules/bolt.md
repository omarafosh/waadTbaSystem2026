## 2023-10-27 - O(N) memory leak in user mapping
**Learning:** In RoleManagementService, the method `getUsersWithRole` was calling `userRepository.findAll().stream().filter(...)` which loads every user into memory. This was particularly dangerous because the relationship from Role to User is unidirectional in this application architecture.
**Action:** Always verify if a relationship mapping exists. If it's unidirectional, write a targeted JPQL query like `@Query("SELECT u.username FROM User u JOIN u.roles r WHERE r.id = :roleId")` to avoid loading all unrelated entities into JVM memory.
