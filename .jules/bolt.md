## 2026-02-04 - Eliminate full-table filtering bottleneck in PreAuthorizationService checkValidity
**Learning:** The `checkValidity` method was using `preAuthorizationRepository.findAll().stream().filter(...)` to find valid pre-authorizations for a member and service, creating a severe performance bottleneck by pulling the whole table into memory.
**Action:** Always prefer pushing data filtering to the database via targeted JPQL queries in the repository instead of loading entire tables into the application memory and filtering using streams.
