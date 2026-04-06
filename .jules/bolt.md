
## 2026-04-06 - [Resolve N+1 Role user counting issue]
**Learning:** Sequential calls to `countUsersWithRole()` inside stream mappers like `toViewDto` trigger an N+1 problem (O(R) DB calls for roles). Using a grouped query `COUNT(u.id) ... GROUP BY r.id` and collecting it into a Map resolves the full-table scan bottleneck efficiently without modifying the entity structure.
**Action:** Always inspect custom mappers like `toViewDto` or map operations in list responses for hidden N+1 queries. Resolve them using batch counts mapped to hash tables for O(1) in-memory lookups instead of eager/lazy fetch toggles.
