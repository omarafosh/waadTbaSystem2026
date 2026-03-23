## 2026-03-23 - Optimize RbacGuardService validateSuperAdminExists
**Learning:** Checking the number of elements meeting a condition inside an entity relationship by fetching all rows, mapping over them, and filtering (`findAll().stream().filter(...).count()`) causes massive N+1 issues and full table scans.
**Action:** Always delegate filtering and counting logic to the database by writing custom Repository methods, such as `countByRolesName(String roleName)`, to limit memory footprint and optimize execution time.
