package com.waad.tba.modules.rbac.mapper;

import com.waad.tba.modules.rbac.dto.*;
import com.waad.tba.modules.rbac.entity.User;
import com.waad.tba.modules.provider.repository.ProviderRepository;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.modules.provider.entity.Provider;
import com.waad.tba.common.entity.Organization;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.function.Function;

@Component
public class UserMapper {

    private final RoleMapper roleMapper;
    private final ProviderRepository providerRepository;
    private final OrganizationRepository organizationRepository;

    public UserMapper(RoleMapper roleMapper, ProviderRepository providerRepository, OrganizationRepository organizationRepository) {
        this.roleMapper = roleMapper;
        this.providerRepository = providerRepository;
        this.organizationRepository = organizationRepository;
    }

    public UserResponseDto toResponseDto(User user) {
        if (user == null) return null;
        
        return toResponseDtoWithNames(
            user,
            user.getEmployerId() != null ?
                organizationRepository.findById(user.getEmployerId())
                    .map(Organization::getName).orElse(null) : null,
            user.getProviderId() != null ?
                providerRepository.findById(user.getProviderId())
                    .map(Provider::getName).orElse(null) : null
        );
    }

    /**
     * ⚡ Bolt: Bulk processing of DTOs to avoid N+1 queries.
     * Rather than executing an individual select for each User's Provider and Employer organization,
     * this method extracts all distinct IDs, batch fetches the relationships into in-memory maps,
     * and performs O(1) lookups during DTO generation.
     */
    public List<UserResponseDto> toResponseDtos(List<User> users) {
        if (users == null) return null;

        Set<Long> employerIds = users.stream()
            .map(User::getEmployerId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        Set<Long> providerIds = users.stream()
            .map(User::getProviderId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        Map<Long, Organization> employers = organizationRepository.findAllById(employerIds).stream()
            .collect(Collectors.toMap(Organization::getId, Function.identity()));

        Map<Long, Provider> providers = providerRepository.findAllById(providerIds).stream()
            .collect(Collectors.toMap(Provider::getId, Function.identity()));

        return users.stream().map(user -> {
            String employerName = null;
            if (user.getEmployerId() != null && employers.containsKey(user.getEmployerId())) {
                employerName = employers.get(user.getEmployerId()).getName();
            }

            String providerName = null;
            if (user.getProviderId() != null && providers.containsKey(user.getProviderId())) {
                providerName = providers.get(user.getProviderId()).getName();
            }
            return toResponseDtoWithNames(user, employerName, providerName);
        }).collect(Collectors.toList());
    }

    private UserResponseDto toResponseDtoWithNames(User user, String employerName, String providerName) {
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.getActive())
                .roles(user.getRoles() != null ? 
                       user.getRoles().stream()
                           .map(roleMapper::toResponseDto)
                           .collect(Collectors.toList()) : null)
                // Employer/Provider associations
                .employerId(user.getEmployerId())
                .employerName(employerName)
                .providerId(user.getProviderId())
                .providerName(providerName)
                // Provider specific permissions
                .allowAllCompanies(user.getAllowAllCompanies())
                .permittedCompanies(user.getPermittedOrganizations() != null ?
                        user.getPermittedOrganizations().stream()
                                .map(this::toEmployerResponseDto)
                                .collect(Collectors.toSet()) : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private UserEmployerResponseDto toEmployerResponseDto(com.waad.tba.common.entity.Organization org) {
        if (org == null) return null;
        return UserEmployerResponseDto.builder()
                .id(org.getId())
                .name(org.getName()) // Use unified name field
                .nameAr(org.getName())
                .code(org.getCode())
                .build();
    }

    public User toEntity(UserCreateDto dto) {
        if (dto == null) return null;
        
        return User.builder()
                .username(dto.getUsername())
                .password(dto.getPassword()) // Will be encoded by service
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .active(true)
                // Employer/Provider associations (2026-01-16)
                .employerId(dto.getEmployerId())
                .providerId(dto.getProviderId())

                .allowAllCompanies(dto.getAllowAllCompanies() != null ? dto.getAllowAllCompanies() : true)
                .build();
    }

    public void updateEntityFromDto(User user, UserUpdateDto dto) {
        if (dto == null) return;
        
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        if (dto.getActive() != null) {
            user.setActive(dto.getActive());
        }
        // Employer/Provider associations (2026-01-16)
        // Fix: Allow setting to null (for unlinking)
        user.setEmployerId(dto.getEmployerId());
        user.setProviderId(dto.getProviderId());
        
        if (dto.getAllowAllCompanies() != null) {
            user.setAllowAllCompanies(dto.getAllowAllCompanies());
        }
    }
}
