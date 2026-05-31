package com.waad.tba.modules.systemadmin.service;

import com.waad.tba.common.exception.ResourceNotFoundException;
import com.waad.tba.modules.systemadmin.service.AuditLogService;
import com.waad.tba.modules.rbac.entity.Permission;
import com.waad.tba.modules.rbac.entity.Role;
import com.waad.tba.modules.rbac.repository.PermissionRepository;
import com.waad.tba.modules.rbac.repository.RoleRepository;
import com.waad.tba.modules.rbac.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PermissionMatrixServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private PermissionMatrixService permissionMatrixService;

    private Role role;
    private Permission perm1;
    private Permission perm2;

    @BeforeEach
    void setUp() {
        role = new Role();
        role.setId(1L);
        role.setName("TEST_ROLE");
        role.setPermissions(new HashSet<>());

        perm1 = new Permission();
        perm1.setId(10L);
        perm1.setName("PERM_1");

        perm2 = new Permission();
        perm2.setId(20L);
        perm2.setName("PERM_2");
    }

    @Test
    void testBulkAssignPermissionsToRole_Success() {
        List<Long> permissionIds = Arrays.asList(10L, 20L);
        Set<Long> uniquePermissionIds = new HashSet<>(permissionIds);

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(uniquePermissionIds)).thenReturn(Arrays.asList(perm1, perm2));

        permissionMatrixService.bulkAssignPermissionsToRole(1L, permissionIds, "admin");

        assertEquals(2, role.getPermissions().size());
        verify(roleRepository).save(role);
        verify(auditLogService).createAuditLog(
                eq("PERMISSIONS_BULK_ASSIGNED"), eq("Role"), eq(1L), anyString(), isNull(), eq("admin"), isNull(), isNull()
        );
    }

    @Test
    void testBulkAssignPermissionsToRole_PermissionNotFound() {
        List<Long> permissionIds = Arrays.asList(10L, 99L);
        Set<Long> uniquePermissionIds = new HashSet<>(permissionIds);

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(uniquePermissionIds)).thenReturn(List.of(perm1));

        assertThrows(ResourceNotFoundException.class, () ->
                permissionMatrixService.bulkAssignPermissionsToRole(1L, permissionIds, "admin")
        );

        verify(roleRepository, never()).save(any());
    }

    @Test
    void testBulkRemovePermissionsFromRole_Success() {
        role.getPermissions().add(perm1);
        role.getPermissions().add(perm2);

        List<Long> permissionIds = Arrays.asList(10L, 20L);
        Set<Long> uniquePermissionIds = new HashSet<>(permissionIds);

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(uniquePermissionIds)).thenReturn(Arrays.asList(perm1, perm2));

        permissionMatrixService.bulkRemovePermissionsFromRole(1L, permissionIds, "admin");

        assertEquals(0, role.getPermissions().size());
        verify(roleRepository).save(role);
    }
}
