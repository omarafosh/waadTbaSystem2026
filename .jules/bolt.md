## 2025-02-14 - Replace N+1 findById Loops with Batch Fetching
**Learning:** Iterating over lists to perform individual `findById` calls in Spring services is a highly common N+1 query pattern that triggers excessive database roundtrips. When removing duplicates and ensuring strict exception parity, `Set`s combined with `findAllById` provide an elegant, equivalent replacement without throwing away validation logic.
**Action:** Always inspect `for` loops in Spring service methods for repository lookup calls and aggressively refactor them into batch queries using `findAllById` or `IN` clauses.
