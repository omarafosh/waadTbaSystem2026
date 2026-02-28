
## 2024-03-01 - N+1 Query in ClaimMapper
**Learning:** `ClaimMapper.toEntity` had a hidden N+1 bottleneck when mapping `ClaimLineDto` to `ClaimLine`. It repeatedly invoked `medicalServiceRepository.findById` inside a loop instead of batching. This is an anti-pattern when mapping incoming DTO arrays to Entities.
**Action:** Always inspect loops in Mappers that accept Lists/Arrays. Use `stream().map().collect(Collectors.toList())` to gather unique IDs, then fetch them all via a `findAllById` repository call before mapping. Store the result in a `Map<Long, Entity>` for O(1) in-loop lookups.
