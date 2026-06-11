## 2024-06-19 - N+1 Queries in Iterative Relationship Assignments
**Learning:** In Spring Data JPA, mapping DTO IDs to Entities inside loops (e.g., `for (Long id : dtoIds) { entity.getRelations().add(repo.findById(id)); }`) creates massive N+1 `SELECT` bottlenecks for bulk assignment operations.
**Action:** Always extract unique IDs into a `HashSet` before the loop, and use `findAllById(uniqueIds)` to perform a batch `SELECT ... WHERE id IN (...)` query. Remember to validate the result set size against the unique IDs to safely preserve `ResourceNotFoundException` behaviors.
