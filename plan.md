1. **Optimize `UserRepository`**: Add `countByRoleName` query with proper `@Param` import to efficiently count users by role name in the database.
2. **Optimize `RbacGuardService`**: Replace `userRepository.findAll().stream().filter(...).count()` with `userRepository.countByRoleName("SUPER_ADMIN")`.
3. **Optimize `PermissionRepository`**: Add `findAllPermissionNames` query to fetch only the permission strings, avoiding full entity hydration.
4. **Optimize `JwtTokenProvider`**: Replace `permissionRepository.findAll().stream().map(Permission::getName)` with `permissionRepository.findAllPermissionNames()`.
5. **Verify changes**: Run `mvn clean package -DskipTests` to ensure compilation is successful and code rules are met.
6. **Pre-commit**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
