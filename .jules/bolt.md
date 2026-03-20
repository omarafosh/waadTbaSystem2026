
## 2026-03-20 - Resolve N+1 bottleneck in ClaimMapper.toEntity
**Learning:** `ClaimMapper.toEntity` had a hidden N+1 query loop when iterating over claim lines to fetch `MedicalService` entities. The `medicalServiceRepository.findById` was invoked inside the `dto.getLines()` loop, causing excessive database queries for claims with many lines.
**Action:** Implemented programmatic batch fetching for `MedicalService` by pre-extracting unique IDs and using `medicalServiceRepository.findAllById`. This pattern pushes the retrieval to a single query (`IN` clause) and leverages an in-memory `Map` for O(1) lookups during the line iterations, which is a safer pattern for data mapping operations to prevent N+1 queries.
