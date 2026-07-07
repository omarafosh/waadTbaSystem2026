1. **Add optimized queries to `CompanyRepository`**
   - Add `findFirstByActiveTrue()` and `findFirstByOrderByIdAsc()` to `CompanyRepository.java`.
2. **Refactor `getDefaultCompany()` in `CompanyService`**
   - Replace the full-table loading and stream filtering `companyRepository.findAll().stream().filter(Company::getActive).findFirst()` with `companyRepository.findFirstByActiveTrue()`.
   - Replace `companyRepository.findAll().stream().findFirst()` with `companyRepository.findFirstByOrderByIdAsc()`.
3. **Refactor `updateDefaultCompany()` in `CompanyService`**
   - Replace the chained `findAll().stream()` fallbacks with `companyRepository.findFirstByActiveTrue()` and `companyRepository.findFirstByOrderByIdAsc()`.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
