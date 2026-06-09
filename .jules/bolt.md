
## 2026-06-09 - PreAuthorizationService.checkValidity() In-Memory Filtering Bottleneck
**Learning:** `PreAuthorizationService.checkValidity()` suffered from an extreme N+1 or full-table memory load bottleneck because it was fetching the entire `PreAuthorization` table via `findAll().stream()` and filtering in-memory to find valid records for a specific member and service.
**Action:** Replaced the full-table load with a targeted database query (`findValidForMemberAndService` in `PreAuthorizationRepository`), transferring filtering and ordering workload to the database, ensuring memory and execution time don't spike linearly with data volume.
