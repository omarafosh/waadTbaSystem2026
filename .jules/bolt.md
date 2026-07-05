
## 2024-07-05 - In-Memory Filtering vs. Database Projections in RBAC
**Learning:** Found critical N+1 and in-memory filtering bottlenecks in `RbacGuardService` and `JwtTokenProvider` where collections like `userRepository.findAll()` and `permissionRepository.findAll()` were loaded entirely into memory and then filtered or mapped via streams. This limits scalability significantly as entity counts grow.
**Action:** Replace `findAll().stream()` logic with targeted JPQL projections (e.g., `countUsersByRoleName` and `findAllPermissionNames`) in Repositories to push aggregate counting and specific field mapping down to the database level, preventing memory exhaustion.
