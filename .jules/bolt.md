## 2026-04-18 - [Resolve N+1 / Full-table load in UnifiedMemberService and CompanyService]
**Learning:** `repository.findAll().stream().filter(...)` and `repository.findAll().stream().findFirst()` were causing full-table data loads into memory for simple lookups like finding an employer or retrieving the default company. Spring Data derived queries can handle this natively without pulling all records into memory.
**Action:** Replace `findAll().stream().findFirst()` with optimized Spring Data methods like `findFirstByActiveTrue()`, `findFirstByOrderByIdAsc()`, and `findFirstByType()`.
