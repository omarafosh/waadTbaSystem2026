## 2024-05-18 - Pre-auth Service Bottleneck
**Learning:** The Java Stream `.max()` resolution for filtering and sorting large datasets loaded into memory via `findAll().stream()` is a severe N+1/memory-bloat anti-pattern in the `PreAuthorizationService`.
**Action:** Always push logic down to the database using JPQL queries with `ORDER BY` and `PageRequest.of(0, 1)` for `LIMIT 1` equivalent when retrieving a single recent record.
