## 2026-04-05 - Optimize PreAuthorizationService checkValidity
**Learning:** Found a full table scan `findAll().stream()` for `PreAuthorizationService.checkValidity()`. It pulls every PreAuthorization record into memory, causing a massive O(N) memory allocation and filtering process.
**Action:** Replaced it with a database-level JPQL query (`findValidPreAuthsForMemberAndService`) that handles filtering by `memberId`, `serviceCode`, active status, approval status, and expiry date. This pushes the computation directly to the database.
