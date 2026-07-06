## 2026-07-06 - Full-table scan optimization in PreAuthorizationService
**Learning:** Found full-table in-memory filtering bottleneck in `PreAuthorizationService.checkValidity()` which loads the entire `PreAuthorization` table to filter out valid pre-authorizations.
**Action:** Always write targeted JPQL queries in repositories instead of fetching all records and filtering them in memory with streams, especially for large transactional tables like PreAuthorizations.
