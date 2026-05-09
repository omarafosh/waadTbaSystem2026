## 2026-05-09 - N+1 queries in DTO mapping
**Learning:** Found N+1 query issue in DTO mapping for `UserMapper`. Each call to `toResponseDto` triggered an individual `findById` lookup for `Organization` and `Provider`.
**Action:** Implemented a new method `toResponseDtos(List<User>)` that batch fetches `Organization` and `Provider` mappings pre-loop into an in-memory `Map` using `findAllById`, improving data loading speed and preventing N+1 problems in paginated requests (`UserService.findAllPaginated`, etc).
