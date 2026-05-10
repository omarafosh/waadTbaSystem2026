## 2026-05-10 - Parameterize JPQL Enum Queries
**Learning:** When using Spring Data JPA with older Hibernate versions, comparing an `@Enumerated` field to a string literal in a `@Query` (e.g., `pa.status = 'APPROVED'`) causes `IllegalArgumentException` or `SemanticException` on startup. Even in modern Spring Boot, it's an anti-pattern.
**Action:** Always use parameterized enum values (`pa.status = :status`) in JPQL `@Query` methods and pass the enum value from the service layer via `@Param`.
