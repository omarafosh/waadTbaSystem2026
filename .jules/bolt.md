## 2024-03-11 - Do not drop business context in optimizations
**Learning:** Optimizing `BenefitPolicyCoverageService.batchGetCoveragePercents` with an `IN` query to solve its N+1 bottleneck must not bypass `getEffectiveCoveragePercent(member, ...)`. Dropping the `member` context skips critical business logic like waiting periods or deductibles. Additionally, using `==` on JPA entity fields like Enums/VisitType fails; `Objects.equals()` must be used.
**Action:** When manually recreating DB logic in memory after a batch fetch, ensure all parameters from the original method calls are preserved and evaluated correctly, and use safe equality checks.

## 2024-03-11 - Frontend yarn lockfile hazards
**Learning:** Running `yarn install` or `corepack enable` in the frontend directory causes massive unintended formatting/version migrations in `yarn.lock` and `package.json`.
**Action:** These files must never be modified without explicit instruction. Rely on existing node_modules or strictly control yarn configurations if dependency installation is somehow required.
