## 2026-05-05 - Fully Qualified Annotations in Patches
**Learning:** When using `replace_with_git_merge_diff` to add new annotations to a Java file, using the fully qualified class name inline (e.g., `@org.springframework.data.repository.query.Param`) avoids the need to separately patch the file's import block, reducing the risk of patch application failures and compilation errors.
**Action:** Use fully qualified annotation paths inline when doing surgical file patches that require new imports, unless a major file refactoring is already happening.
