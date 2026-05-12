## 2025-05-12 - Database Counting for RBAC Guards
**Learning:** Checking condition invariants by loading entire tables into memory via `findAll().stream().filter(...)` (e.g., in `RbacGuardService` to count SUPER_ADMINs) causes severe memory bloat and potential OOM errors when verifying permissions during updates.
**Action:** Always replace `findAll().stream()` aggregations with targeted database queries (like `countByRoleName`) to push processing to the DB layer where it is highly optimized, even for seemingly small or infrequent validations.
