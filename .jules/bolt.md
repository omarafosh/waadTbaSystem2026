## 2026-05-18 - Avoid loading full table to find a single PreAuth via Streams
**Learning:** Using `findAll().stream().filter(...).max(...)` in `PreAuthorizationService` pulls all records into memory to find a single valid pre-auth, causing severe memory overhead and O(N) lookup.
**Action:** Always delegate filtering, sorting, and pagination (`PageRequest.of(0, 1)`) to the database using JPQL queries to efficiently fetch just the single required record.
