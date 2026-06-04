## 2026-06-04 - Fix N+1 Query mapping issue in UserMapper
**Learning:** `UserMapper.toResponseDto` caused N+1 database queries when mapping lists of users because it made individual `findById` calls for `Organization` and `Provider` inside the mapping loop. This was a known unresolved optimization target from the memory notes.
**Action:** Replaced stream-based mapping with `userMapper.toResponseDtos` that performs a single batch retrieval (`findAllById`) for `employerId`s and `providerId`s pre-loop and uses in-memory HashMaps for O(1) lookups during entity-to-DTO conversion.
