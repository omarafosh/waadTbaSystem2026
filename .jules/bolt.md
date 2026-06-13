
## 2025-06-13 - O(N) Database Queries in Permission Assignment
**Learning:** Found multiple instances where permissions were being assigned/removed from roles via loops calling `findById` individually (e.g., in `RoleService` and `PermissionMatrixService`). This creates classic N+1 database read problems.
**Action:** Always refactor such loops to extract unique IDs into a `HashSet` and use `repository.findAllById(uniqueIds)` in a single query. When preserving exception semantics like `ResourceNotFoundException`, compare the size of the fetched list against the `Set`'s size.
