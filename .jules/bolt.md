## 2026-03-21 - N+1 Query Bottleneck in ClaimMapper

**Learning:** `ClaimMapper.toEntity` creates claims by fetching effective prices individually in a loop (`providerContractService.getEffectivePrice`) using single database queries per `ClaimLine`. This resulted in severe N+1 query bottlenecks during bulk claim processing.

**Action:** To optimize N+1 queries in service methods where JPA fetching isn't the issue, use a programmatic batching approach. Group required entities (like `MedicalService` codes), batch-fetch them using an `IN` clause (e.g. `medicalServiceRepository.findByCodes()`), fetch their respective relationships or calculated values in a single batched repository query (`pricingRepository.findEffectivePricingInBatch()`), build an intermediate `Map` for constant-time $O(1)$ lookups, and use the map in the main processing loop instead of making DB calls.
