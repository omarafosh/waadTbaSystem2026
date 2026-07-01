
## 2026-07-01 - Replace Full Table Scan in PreAuthorizationService with JPQL Query
**Learning:** Checking Enum equality in Spring Data JPA queries works best by passing the Enum type as a parameter rather than mapping it to a string directly in the query (e.g., `pa.status = 'APPROVED'`). This avoids runtime translation crashes when standard Hibernate maps the Enum as `EnumType.ORDINAL` (JPA default) instead of `EnumType.STRING`.
**Action:** When performing equality checks in `@Query` for Enum types, always inject the Enum using `@Param("status")` instead of hardcoding string values.
