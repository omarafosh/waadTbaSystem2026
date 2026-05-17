## 2024-05-17 - Batching DB Lookups to Prevent N+1
**Learning:** Sequential `findById` inside loops for many-to-many relationship mapping (like roles to permissions) is a common anti-pattern that creates severe N+1 bottlenecks.
**Action:** Replace `findById` loops with `findAllById` and explicitly perform size assertions to preserve strict `ResourceNotFoundException` requirements perfectly.
