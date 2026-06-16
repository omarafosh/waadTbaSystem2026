## 2024-05-24 - O(N) memory load in RbacGuardService count
**Learning:** `RbacGuardService.validateSuperAdminExists` loaded the entire User table into application memory to count SUPER_ADMIN users using `userRepository.findAll().stream().filter(...)`. This causes significant CPU/Memory overhead as the user base scales.
**Action:** Replace `findAll().stream().count()` with targeted Spring Data derived count queries (e.g., `countByRolesName`) to push aggregation to the database where it's optimized with indexes.
