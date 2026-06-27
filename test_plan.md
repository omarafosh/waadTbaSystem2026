1.  **Analyze PreAuthorizationService**
    *   The method `checkValidity(Long memberId, String serviceCode)` in `PreAuthorizationService.java` fetches all pre-authorizations (`preAuthorizationRepository.findAll().stream()`) and filters them in memory.
    *   This is an O(N) operation leading to a memory bottleneck.

2.  **Add Database Query in PreAuthorizationRepository**
    *   Add a new JPQL query `findValidPreAuthorizationsForMemberAndService` in `PreAuthorizationRepository.java` that directly filters by memberId, serviceCode, active=true, status=APPROVED, and checks if expiryDate is valid.
    *   We can use an existing query structure or modify `findValidPreAuthorizations` to suit this exact purpose, but it's safer to create a new one to avoid breaking other flows.

3.  **Update PreAuthorizationService.java**
    *   Modify `checkValidity` to use the new database query instead of `findAll().stream()`.
    *   Retain the logic to return the most recent valid pre-authorization if multiple exist.

4.  **Verify Code Compilation**
    *   Run `mvn clean package -f backend/pom.xml -DskipTests` to ensure compilation works.

5.  **Run Pre-Commit Checks**
    *   Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
