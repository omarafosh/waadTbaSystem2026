
## 2024-05-24 - [Avoid In-Memory Full-Table Processing for JWT Generation]
**Learning:** Using `findAll().stream().map(...)` on entities just to extract one column (like names) for JWT payloads causes excessive memory consumption, especially when called frequently during authentication.
**Action:** Use targeted database projection queries like `@Query("SELECT p.name FROM Permission p")` to only fetch required data into memory.
