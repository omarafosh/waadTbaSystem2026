## 2024-05-24 - PreAuthorization Service In-Memory Filtering Bottleneck
**Learning:** Found another `findAll().stream()` bottleneck in `PreAuthorizationService.checkValidity()`. It fetches all pre-authorizations and filters them by memberId, serviceCode, status, active state, and expiry date. This is an O(N) memory and time operation where N is the total number of pre-authorizations in the system.
**Action:** Replace the in-memory filtering with a targeted JPQL query in `PreAuthorizationRepository`.
