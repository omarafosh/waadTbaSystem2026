## 2026-04-28 - Prevent O(N) Role Checks
**Learning:** Checking for role counts using `repository.findAll().stream()` causes massive, unnecessary memory consumption and O(N) application bottlenecks for large tables.
**Action:** Always push counting or specific column projections directly to the DB using JPQL aggregate queries (`SELECT COUNT(u)`, `SELECT u.username`) instead of bringing the full table into memory.
