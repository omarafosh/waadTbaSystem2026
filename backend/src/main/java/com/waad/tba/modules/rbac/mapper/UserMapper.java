package com.waad.tba.modules.rbac.mapper;

import com.waad.tba.modules.rbac.dto.*;
import com.waad.tba.modules.rbac.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    private final RoleMapper roleMapper;

    public UserMapper(RoleMapper roleMapper) {
        this.roleMapper = roleMapper;
    }

    public UserResponseDto toResponseDto(User user) {
        if (user == null) return null;
        
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
                .providerId(user.getProviderId())
                // Custom permissions
                .canViewClaims(user.getCanViewClaims())
                .canViewVisits(user.getCanViewVisits())
                .canViewReports(user.getCanViewReports())
                .canViewMembers(user.getCanViewMembers())
                .canViewBenefitPolicies(user.getCanViewBenefitPolicies())
                // Provider specific permissions
                .allowAllCompanies(user.getAllowAllCompanies())
                .permittedCompanies(user.getPermittedCompanies() != null ?
                        user.getPermittedCompanies().stream()
                                .map(this::toEmployerResponseDto)
                                .collect(Collectors.toSet()) : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private UserEmployerResponseDto toEmployerResponseDto(com.waad.tba.modules.employer.entity.Employer employer) {
        if (employer == null) return null;
        return UserEmployerResponseDto.builder()
                .id(employer.getId())
                .name(employer.getNameAr()) // Use nameAr as name by default for UI mapping
                .nameAr(employer.getNameAr())
                .code(employer.getCode())
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
                // Custom permissions for EMPLOYER users
                .canViewClaims(dto.getCanViewClaims() != null ? dto.getCanViewClaims() : true)
                .canViewVisits(dto.getCanViewVisits() != null ? dto.getCanViewVisits() : true)
                .canViewReports(dto.getCanViewReports() != null ? dto.getCanViewReports() : true)
                .canViewMembers(dto.getCanViewMembers() != null ? dto.getCanViewMembers() : true)
                .canViewBenefitPolicies(dto.getCanViewBenefitPolicies() != null ? dto.getCanViewBenefitPolicies() : true)
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
        if (dto.getEmployerId() != null) {
            user.setEmployerId(dto.getEmployerId());
        }
        if (dto.getProviderId() != null) {
            user.setProviderId(dto.getProviderId());
        }
        if (dto.getAllowAllCompanies() != null) {
            user.setAllowAllCompanies(dto.getAllowAllCompanies());
        }
    }
}
