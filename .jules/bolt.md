## 2026-03-02 - Batch N+1 Resolution in BenefitPolicyCoverageService
**Learning:** JPQL IN clauses crash when given an empty list. When batch-fetching entities to resolve N+1 queries using collected relationship IDs (e.g. `categoryIds`), you must provide a safe fallback (like `[-1L]`) if the list can be empty.
**Action:** When implementing batch entity resolution with `IN` queries based on dynamically collected IDs, always check if the collection is empty and provide a safe non-matching value before passing it to the repository query.
