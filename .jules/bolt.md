
## 2024-07-07 - In-Memory Filtering Fallback Anti-Pattern
**Learning:** Found a recurring pattern in the codebase where fallback resolution logic (like finding a default company) relies on loading the entire table into application memory (`findAll().stream().filter(...)` or `findAll().stream().findFirst()`) instead of using targeted Spring Data JPA database queries. This creates serious performance and memory overheads, especially as tables grow.
**Action:** When implementing fallback logic or simple property-based lookups, always prefer executing aggregate or `findFirstBy...` projections directly in the database to prevent unnecessary memory bloat.
