package com.waad.tba.modules.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Boolean active;
    private List<RoleResponseDto> roles;

    // Employer/Provider associations
    private Long employerId;
    private Long providerId;

    // Custom permissions for EMPLOYER users
    private Boolean canViewClaims;
    private Boolean canViewVisits;
    private Boolean canViewReports;
    private Boolean canViewMembers;
    private Boolean canViewBenefitPolicies;

    // Provider specific permissions
    private Boolean allowAllCompanies;
    private java.util.Set<UserEmployerResponseDto> permittedCompanies;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
