## 2026-05-31 - [N+1 Optimization] Fixed N+1 queries during bulk permission assignments
**Learning:** When replacing iterative `findById` calls inside loops with batch `findAllById(ids)` to eliminate N+1 database bottlenecks, it's critical to deduplicate the requested IDs into a `Set` before doing size comparisons to retain original exception-throwing behavior if duplicate IDs exist in the payload.
**Action:** Always wrap lists in a HashSet when calculating the expected fetched entity count to safely map to original `ResourceNotFoundException` handling logic.
