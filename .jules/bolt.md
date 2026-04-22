## 2026-04-22 - [Backend N+1 Query Fix in UserMapper]
**Learning:** During DTO mapping, fetching related entities (`Organization`, `Provider`) via `repository.findById()` for each user creates severe N+1 database queries when mapping lists of users.
**Action:** Always utilize or create a batch fetching method (e.g., `toResponseDtos`) that gathers unique foreign keys, queries the related entities in bulk (using `findAllById`), and maps them in memory for O(1) lookup during list mapping.
