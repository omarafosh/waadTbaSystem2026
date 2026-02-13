## 2026-02-13 - Flyway Version Discrepancy
**Learning:** The project uses `V1.xx` naming convention for Flyway migrations (e.g., `V1.22`), but `FlywayMigrationVerificationTest` seems to expect or validate against `V111`+ versions, causing potential confusion or test failures.
**Action:** Always check `backend/src/main/resources/db/migration` for the actual migration history and follow the existing file naming pattern (e.g., `V1.23`) rather than test expectations until the test is updated.

## 2026-02-13 - Backend Test Environment
**Learning:** `mvn test` fails because it expects a running external database. There is no H2 in-memory configuration active for integration tests.
**Action:** Use `mvn package -DskipTests` to verify build integrity when database is not available.
