## 2026-06-27 - PreAuthorization Service in-memory filtering bottleneck
**Learning:** Filtering a growing core domain entity like `PreAuthorization` by calling `findAll().stream().filter(...)` is extremely dangerous and causes severe memory overhead and DB load.
**Action:** Push projection and filtering down to the database using targeted JPQL `@Query` methods (e.g. `findValidPreAuthorizationsForMemberAndService`) to let the DB handle filtering and sorting, instead of loading the entire table into application memory.
