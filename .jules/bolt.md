
## $(date +%Y-%m-%d) - Eliminate N+1 and O(N) memory load via stream over findAll()
**Learning:** Found several locations doing `repository.findAll().stream().filter(...)` instead of pushing the count and retrieval logic into the database via JPQL. This causes full table loads into application memory, severe latency, and risk of OOM errors as the data grows.
**Action:** When working on services, always push aggregation, filtering, and conditional logic to the DB layer using explicitly written JPQL `@Query` methods on the Repository rather than `findAll()` streaming in Java.
