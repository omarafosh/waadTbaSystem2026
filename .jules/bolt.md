## 2026-06-02 - RoleManagementService O(N) In-Memory Filtering
**Learning:** Found an O(N) memory anti-pattern where `userRepository.findAll()` was loaded into application memory just to count users by role and map usernames by role. The unidirectional relationship from User -> Role requires queries to drive from User.
**Action:** Replaced `findAll().stream().filter(...)` with custom JPQL queries `countUsersByRoleId` and `findUsernamesByRoleId` in `UserRepository`. This ensures O(1) processing time directly in the database without risking OutOfMemoryErrors as the user base grows.
