## 2024-05-23 - [JPA Multiple Bag Fetch Optimization]
**Learning:** Fetching multiple `@OneToMany` Lists (bags) in a single JPQL query causes a Cartesian product (rows = parents * children1 * children2), leading to massive data duplication or `MultipleBagFetchException`.
**Action:** Always split queries for multiple collections. Keep one `JOIN FETCH` for the most critical collection, and let others lazy load (optimized with `@BatchSize` or `default_batch_fetch_size`).
