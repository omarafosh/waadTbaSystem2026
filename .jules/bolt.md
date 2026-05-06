## 2024-05-24 - [Avoid In-Memory Projection for Entire Tables]
**Learning:** In Spring Boot applications, extracting a single field (like permission names) from an entire table by fetching all entities into memory (`findAll().stream().map(...)`) causes unnecessary memory consumption and overhead, especially as the table grows.
**Action:** Use targeted JPQL `@Query` methods (e.g., `@Query("SELECT p.name FROM Permission p")`) to push the projection directly to the database, fetching only the required fields.
