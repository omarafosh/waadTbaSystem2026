## 2026-05-13 - Fixed PreAuthorizationService in-memory filter bottleneck
**Learning:** The full-table in-memory filtering bottleneck in `PreAuthorizationService` (`checkValidity`) via `findAll().stream().filter(...)` has been resolved by implementing a targeted JPQL query `findValidPreAuthorizationsForMemberAndService` in `PreAuthorizationRepository`.
**Action:** Always search for `findAll().stream()` in service layers and replace with targeted database queries to push filtering to the database, preventing O(N) whole-table memory loads.
