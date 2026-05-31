package com.waad.tba.modules.rbac.service;

import com.waad.tba.common.exception.ResourceNotFoundException;
import com.waad.tba.modules.rbac.dto.AssignPermissionsDto;
import com.waad.tba.modules.rbac.dto.RoleResponseDto;
import com.waad.tba.modules.rbac.entity.Permission;
import com.waad.tba.modules.rbac.entity.Role;
import com.waad.tba.modules.rbac.mapper.RoleMapper;
import com.waad.tba.modules.rbac.repository.PermissionRepository;
import com.waad.tba.modules.rbac.repository.RoleRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RoleMapper roleMapper;

    @InjectMocks
    private RoleService roleService;

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
    void testAssignPermissions_Success() {
        AssignPermissionsDto dto = new AssignPermissionsDto(Arrays.asList(10L, 20L));
        Set<Long> permissionIds = new HashSet<>(Arrays.asList(10L, 20L));

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(permissionIds)).thenReturn(Arrays.asList(perm1, perm2));
        when(roleRepository.save(any(Role.class))).thenReturn(role);
        when(roleMapper.toResponseDto(any(Role.class))).thenReturn(new RoleResponseDto());

        RoleResponseDto result = roleService.assignPermissions(1L, dto);

        assertNotNull(result);
        assertEquals(2, role.getPermissions().size());
        verify(roleRepository).findById(1L);
        verify(permissionRepository).findAllById(permissionIds);
        verify(roleRepository).save(role);
    }

    @Test
    void testAssignPermissions_PermissionNotFound() {
        AssignPermissionsDto dto = new AssignPermissionsDto(Arrays.asList(10L, 99L));
        Set<Long> permissionIds = new HashSet<>(Arrays.asList(10L, 99L));

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(permissionIds)).thenReturn(List.of(perm1)); // Only perm1 found

        assertThrows(ResourceNotFoundException.class, () -> roleService.assignPermissions(1L, dto));

        verify(roleRepository).findById(1L);
        verify(permissionRepository).findAllById(permissionIds);
        verify(roleRepository, never()).save(any());
    }
}
