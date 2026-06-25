## 2026-06-25 - Truncated Test Assertions
**Learning:** Modifying the string in an `assertEquals` statement to match an incomplete assertion without modifying the source logic that throws the exception will cause tests to fail. Code review engines flag this as a critical regression.
**Action:** When fixing isolated tests to bypass DB failures, ensure the core logic and test assertions remain exactly identical to the original behavior unless intentionally modifying the business requirement.
