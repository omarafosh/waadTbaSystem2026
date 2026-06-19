## 2024-06-19 - UnifiedMemberService Full-Table Scan Optimization
**Learning:** Avoid using `findAll().stream().filter(...)` in Spring Data fallback logic.
**Action:** Replace inefficient stream filtering with targeted JPQL or derived queries like `findFirstByType`.
