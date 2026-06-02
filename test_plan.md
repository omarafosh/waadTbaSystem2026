1. **Fix `UserRepository`**: Edit `backend/src/main/java/com/waad/tba/modules/rbac/repository/UserRepository.java` to add the following JPQL queries to push filtering to the database:
   - `@Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.id = :roleId") Long countUsersByRoleId(@org.springframework.data.repository.query.Param("roleId") Long roleId);`
   - `@Query("SELECT u.username FROM User u JOIN u.roles r WHERE r.id = :roleId") List<String> findUsernamesByRoleId(@org.springframework.data.repository.query.Param("roleId") Long roleId);`

2. **Refactor `RoleManagementService`**: Edit `backend/src/main/java/com/waad/tba/modules/systemadmin/service/RoleManagementService.java` to use the newly created repository methods in `getUsersWithRole` and `countUsersWithRole`.

3. **Verify Tests**:
   - Run isolated unit tests to verify the changes: `mvn test -Dtest=RoleServiceTest,PermissionMatrixServiceTest -f backend/pom.xml`.

4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
