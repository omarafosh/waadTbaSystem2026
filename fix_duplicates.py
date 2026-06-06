import re

with open('./backend/src/main/java/com/waad/tba/modules/systemadmin/service/RoleManagementService.java', 'r') as f:
    content = f.read()

# The pattern for the helper method
method_pattern = r'    private RoleViewDto toViewDtoWithCount\(Role role, long userCount\) \{\n        return RoleViewDto\.builder\(\)\n                \.id\(role\.getId\(\)\)\n                \.name\(role\.getName\(\)\)\n                \.description\(role\.getDescription\(\)\)\n                \.permissions\(role\.getPermissions\(\)\.stream\(\)\n                        \.map\(Permission::getName\)\n                        \.collect\(Collectors\.toList\(\)\)\)\n                \.userCount\(\(int\) userCount\)\n                \.createdAt\(role\.getCreatedAt\(\)\)\n                \.updatedAt\(role\.getUpdatedAt\(\)\)\n                \.build\(\);\n    \}\n\n'

# Find all occurrences
matches = re.findall(method_pattern, content)

# If there are duplicates, replace all but one
if len(matches) > 1:
    # First, remove all occurrences
    content = re.sub(method_pattern, '', content)
    # Then insert exactly one occurrence before toViewDto
    replacement = matches[0] + r'    private RoleViewDto toViewDto(Role role) {'
    content = re.sub(r'    private RoleViewDto toViewDto\(Role role\) \{', replacement, content)

with open('./backend/src/main/java/com/waad/tba/modules/systemadmin/service/RoleManagementService.java', 'w') as f:
    f.write(content)
