## 2026-06-27 - [Resolved PreAuthService memory bottleneck]
**Learning:** `findAll().stream().filter(...)` operations in Spring services fetch the entire table into JVM memory before filtering. This is a severe O(N) memory and performance bottleneck, especially in tables that grow rapidly like `PreAuthorization`.
**Action:** Always replace application-level stream filtering with database-level JPQL `@Query` methods or derived repository methods that push `WHERE` clauses directly to the database.
