## 2026-06-05 - Avoid Unnecessary Test Changes

**Learning:** When adding `@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)` to fix `UnnecessaryStubbingException` in tests like `UnifiedMemberServiceTest`, ensure you do not inadvertently modify assertion strings or add unneeded `@Mock` fields unless directly related to the issue, as this can cause compilation or test failures and violates the scope of the original task.

**Action:** Always run tests locally first and only commit test fixes that are strictly necessary to make the current optimization pass verification. Revert unrelated test changes.
