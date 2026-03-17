## 2024-03-17 - Prevent N+1 queries with FetchType.LAZY on @ManyToOne
**Learning:** Using `FetchType.EAGER` on `@ManyToOne` relationships (like `ProviderAllowedEmployer.employer`) creates a global JPA fetching anti-pattern and often worsens performance by causing N+1 query bottlenecks during parent entity fetches.
**Action:** Always use `FetchType.LAZY` for `@ManyToOne` relationships. Rely on explicit `LEFT JOIN FETCH` in targeted repository queries or `@BatchSize` (e.g., on the `Organization` entity) to batch load related entities efficiently.
