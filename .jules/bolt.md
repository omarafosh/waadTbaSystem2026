## 2024-05-28 - UnifiedMemberService findAll memory optimization
**Learning:** `organizationRepository.findAll().stream().filter(...)` was identified as loading all organizations into memory just to find the first employer match. `findFirstByType()` already exists and can do this safely entirely in the DB.
**Action:** Always favor derived query methods like `findFirstBy...` to limit results at DB level rather than pulling large datasets to filter via Streams.
