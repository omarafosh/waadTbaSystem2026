## 2024-05-18 - Replacing memory-intensive filtering with JPQL queries
**Learning:** Using `repository.findAll().stream().filter(...)` instead of database queries can cause serious memory bottlenecks on large datasets and ignores indexes.
**Action:** Always prefer pushing filter operations down to the database using JPQL queries rather than loading the full dataset into memory.
