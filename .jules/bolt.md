## 2026-04-10 - ApplicationContext Loading Issues in Backend Tests
**Learning:** The backend test suite currently fails to initialize its ApplicationContext due to database connection / Hikari / Flyway constraints. ArchitecturalRulesRegressionTest similarly fails to load. Memory indicated this, but trying it confirmed it.
**Action:** Rely on mvn -DskipTests clean package for compilation checking. Any required isolated unit tests must not use @SpringBootTest if the database isn't fully set up.
