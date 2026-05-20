## 2026-05-20 - PreAuthorizationService Bottleneck Resolved
**Learning:** The `PreAuthorizationService.checkValidity` method contained a full-table in-memory filtering bottleneck using `findAll().stream().filter(...)`.
**Action:** Replaced the stream filtering with a targeted JPQL query `findValidPreAuthorizationsForMemberAndService` in `PreAuthorizationRepository` to push the O(N) memory load to the database level.
