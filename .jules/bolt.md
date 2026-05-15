## 2026-05-15 - N+1 Issue during Entity to DTO mapping in Collections
**Learning:** Calling `Mapper::toResponseDto` inside loops or streams for mapping database entity collections naturally introduces N+1 performance issues when the target entity uses `repository.findById` internally to resolve properties (e.g. `Employer`, `Provider`).
**Action:** Always implement a batching variant (e.g. `toResponseDtos`) that accepts the collection, retrieves IDs, batch-fetches nested relationships (`findAllById`) into HashMaps, and leverages these structures to construct DTOs without additional queries.
