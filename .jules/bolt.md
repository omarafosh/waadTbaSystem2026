## 2026-06-07 - Resolved N+1 querying in RoleManagementService mapping operations
**Learning:** `roleRepository.findAll().stream().map(this::toViewDto)` inside `getAllRoles` and `searchRoles` triggered N+1 database queries due to iteratively calling `userRepository.findAll().stream().filter(...).count()` inside the mapper.
**Action:** Replaced the full-table load/filter per role with `userRepository.countUsersByRoleIds(roleIds)` to batch query counts directly from the DB (`GROUP BY r.id`) in O(1) mapper operations.
