## 2026-03-07 - [PreAuth Dashboard findAll bottleneck resolved]
**Learning:** Dashboard aggregations processing raw rows retrieved via `findAll()` from Repositories creates severe database latency and O(N) memory overload.
**Action:** Use JPQL aggregated specific queries such as `SUM(CASE WHEN ... THEN ... ELSE 0 END)` directly on the database side and define them neatly within the Repository instead. Note that `findAll()` loops should be aggressively removed from dashboard/stats calculation services.
