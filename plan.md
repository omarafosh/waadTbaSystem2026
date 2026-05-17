1. **Optimize `RoleManagementService`**:
   - Replace in-memory filtering (`userRepository.findAll().stream()`) in `getUsersWithRole` and `countUsersWithRole` with targeted JPQL queries.
2. **Update `UserRepository`**:
   - Add `@Query("SELECT u.username FROM User u JOIN u.roles r WHERE r.id = :roleId") List<String> findUsernamesByRolesId(@org.springframework.data.repository.query.Param("roleId") Long roleId);`
   - Add `@Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.id = :roleId") long countByRolesId(@org.springframework.data.repository.query.Param("roleId") Long roleId);`
3. **Optimize N+1 queries in `RoleService` and `PermissionMatrixService`**:
   - In `RoleService.assignPermissions`, use `permissionRepository.findAllById` instead of iterating `findById`.
   - In `PermissionMatrixService.bulkAssignPermissionsToRole` and `bulkRemovePermissionsFromRole`, use `findAllById` instead of iterating `findById`.
   - Use a HashSet to track found IDs and accurately maintain the `ResourceNotFoundException` behavior if an ID is missing.
4. **Compile check and unit tests (if any)**:
   - Run `mvn -DskipTests clean package -f backend/pom.xml`.
5. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
6. **Submit PR with Bolt performance metrics**.
