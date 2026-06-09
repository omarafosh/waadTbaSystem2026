## 2025-02-12 - [Soft Deletes: Bulk Update vs Iterative Saving]
**Learning:** When performing bulk logical deletes (soft deletes) on child entities, using an iterative `.save()` approach generates an O(N) stream of individual `UPDATE` statements, leading to severe N+1 database performance bottlenecks.
**Action:** Always prefer executing a bulk JPQL query (e.g., `UPDATE Entity e SET e.active = false WHERE e.parent.id = :parentId`) for soft deletes over looping and saving individual entities, especially in services managing collections like pricing items.
