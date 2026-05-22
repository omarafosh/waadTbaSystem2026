
## 2024-05-22 - Replaced Memory-Intensive Filtering in CompanyService
**Learning:** `CompanyService` relied heavily on `repository.findAll().stream().filter(...)` and `findAll().stream().findFirst()` to find default and active companies. This anti-pattern loaded the entire `Company` table into memory just to return a single record, causing an O(N) memory and performance hit that grows with the dataset.
**Action:** Always identify uses of `findAll().stream().findFirst()` or `findAll().stream().filter(...)` in services when searching for a single record. Replace them with Spring Data derived queries using `findFirstBy...` (e.g., `findFirstByActiveTrue()`, `findFirstByOrderByIdAsc()`) to push the limit and filtering to the database level (generating an efficient SQL `LIMIT 1`).
