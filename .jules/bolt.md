
## 2026-07-06 - In-Memory Filtering Bottleneck in PreAuthorizationService `checkValidity`
**Learning:** The `checkValidity` method in `PreAuthorizationService` was using `findAll().stream().filter(...)` to find the most recent valid pre-authorization for a member and service, loading the entire `PreAuthorization` table into application memory which is a massive performance bottleneck.
**Action:** Replaced the full-table scan with a targeted JPQL query `findValidPreAuthorizationsForMemberAndService` in `PreAuthorizationRepository` that filters by `memberId`, `serviceCode`, `active`, `status`, and `expiryDate`, while explicitly sorting by `createdAt DESC` to fetch the exact record directly from the database.
