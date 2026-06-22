## 2026-06-22 - Resolve Role Management Service N+1 Optimization
**Learning:** For counting users or fetching usernames by specific roles in `RoleManagementService`, using `userRepository.findAll().stream().filter(...)` causes an enormous full-table database fetch and loads all entities into memory.
**Action:** Replace it with targeted JPQL queries such as `findUsernamesByRolesId` and `countByRolesId` in `UserRepository` and directly query without loading unnecessary data to avoid O(N) memory and performance bottlenecks.

## 2026-06-22 - Optimizing Single Redundant Queries in Service Maps
**Learning:** For methods making redundant individual lookups like `countUsersWithRole(role.getId())` (which internally re-validates `roleRepository.existsById(...)` multiple times), directly calling the repository projection (`userRepository.countByRolesId(...)`) avoids redundant database existence checks while mapping a DTO for a specific pre-fetched `role`.
**Action:** When calling repository queries inside a `.map(...)` or mapping method that receives a fetched entity, directly call the query rather than a public helper method that performs its own `existsById` or redundant validation.
