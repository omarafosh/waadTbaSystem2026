## 2024-05-31 - Resolved RoleService/PermissionMatrixService N+1 Bottlenecks
**Learning:** In Spring Boot RBAC modules, iterating over loops to assign/remove permissions using `findById` one by one causes a severe N+1 query problem, especially during bulk operations.
**Action:** Replaced loop-based `findById` calls with pre-loop `findAllById` fetching. Used a deduplicated Set of requested IDs to validate the returned size against the requested size to safely mimic the original `ResourceNotFoundException` behavior for missing entities.
