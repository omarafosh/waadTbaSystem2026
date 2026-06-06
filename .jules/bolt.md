## 2026-06-06 - Pre-Auth DB O(N) In-Memory Filtering Bottleneck
**Learning:** `PreAuthorizationService.checkValidity` was fetching the entire table using `findAll().stream()` to find a single valid pre-authorization for a member and service, causing O(N) memory and CPU consumption.
**Action:** Replaced iterative table loading with a targeted JPQL query (`findValidForMemberAndService`) passing `PageRequest.of(0,1)` to limit results to a single record directly from the database query.
