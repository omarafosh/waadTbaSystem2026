## 2024-05-02 - [Count Optimization in RbacGuardService]
**Learning:** Checking for the existence or count of entities with specific conditions using `repository.findAll().stream().filter(...).count()` creates severe full-table load memory bottlenecks and O(N) execution time issues for what should be a simple scalar lookup.
**Action:** Always push counting and existence checks down to the database using targeted JPQL `@Query` methods (e.g. `SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName`) to ensure minimal memory usage and O(1) retrieval times.
