## 2026-04-09 - N+1 Query in RoleManagementService

**Learning:** When retrieving a list of entities (like Roles) that require counting associated entities (like Users), avoiding in-memory `.stream().count()` is critical. Furthermore, performing an individual counting query per entity during DTO mapping causes an N+1 performance bottleneck.

**Action:** Push projection and counting to the database level using `GROUP BY` and a single query returning a Map or `List<Object[]>`. The results should be pre-fetched, collected into a Map in the service layer, and passed down or used during DTO creation for O(1) lookups, completely eliminating N+1 scaling issues while processing lists.
