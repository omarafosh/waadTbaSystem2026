package com.waad.tba.modules.rbac.entity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.waad.tba.modules.employer.entity.Employer;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;

    /**
     * Profile image URL (nullable)
     * Used for avatar display in frontend
     * Falls back to first letter of name if null
     */
    @Column(name = "profile_image_url")
    private String profileImageUrl;

    /**
     * Timestamp when password was last changed
     * Updated whenever user changes their password
     * Used for password audit and expiration policies
     */
    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    /**
     * Employer ID - for EMPLOYER_ADMIN users
     * Links the user to a specific employer company.
     * Used to restrict access to employer-specific data.
     */
    @Column(name = "employer_id")
    private Long employerId;

    /**
     * Provider ID - for PROVIDER users
     * Links the user to a specific healthcare provider (hospital, clinic, etc.).
     * Used to restrict access to provider-specific data (visits, claims).
     * PROVIDER users can only see data for their assigned provider.
     */
    @Column(name = "provider_id")
    private Long providerId;

    /**
     * @deprecated Legacy field kept for backwards compatibility.
     * NOT used for operational filtering or authorization.
     * All operational data access is employer-centric via employerId.
     * This field may be used for INSURANCE_ADMIN display purposes only.
     * See: COMPANY-EMPLOYER-REFACTOR-SUMMARY.md (2025-12-27)
     */
    @Deprecated
    @Column(name = "company_id")
    private Long companyId;

    // ========================================================================
    // CUSTOM PERMISSIONS for EMPLOYER users
    // Fine-grained access control for what employer users can see/do
    // ========================================================================

    /**
     * Can view/manage claims
     * Default: true for EMPLOYER_ADMIN, configurable per user
     */
    @Column(name = "can_view_claims")
    @Builder.Default
    private Boolean canViewClaims = true;

    /**
     * Can view/manage visits
     * Default: true for EMPLOYER_ADMIN, configurable per user
     */
    @Column(name = "can_view_visits")
    @Builder.Default
    private Boolean canViewVisits = true;

    /**
     * Can view reports
     * Default: true for EMPLOYER_ADMIN, configurable per user
     */
    @Column(name = "can_view_reports")
    @Builder.Default
    private Boolean canViewReports = true;

    /**
     * Can view/manage members
     * Default: true for EMPLOYER_ADMIN, configurable per user
     */
    @Column(name = "can_view_members")
    @Builder.Default
    private Boolean canViewMembers = true;

    /**
     * Can view/manage benefit policies
     * Default: true for EMPLOYER_ADMIN, configurable per user
     */
    @Column(name = "can_view_benefit_policies")
    @Builder.Default
    private Boolean canViewBenefitPolicies = true;

    /**
     * Whether the user can see members from all companies contracted with the provider.
     * Default: true (backwards compatibility and typical behavior).
     */
    @Column(name = "allow_all_companies")
    @Builder.Default
    private Boolean allowAllCompanies = true;

    /**
     * Specific list of companies/employers this user is permitted to see.
     * Only used if allowAllCompanies is false.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_permitted_companies",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "employer_id")
    )
    @Builder.Default
    private Set<Employer> permittedCompanies = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /**
     * Number of consecutive failed login attempts
     * Reset to 0 on successful login
     * Used for account lockout mechanism
     */
    @Column(name = "failed_login_count", nullable = false)
    @Builder.Default
    private Integer failedLoginCount = 0;

    /**
     * Account locked until this timestamp (NULL = not locked)
     * Auto-unlock when current time > lockedUntil
     * Locked after 5 consecutive failed attempts
     */
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    /**
     * Timestamp of last successful login
     * Updated on each successful authentication
     */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Check if account is currently locked
     * @return true if locked and lock period has not expired
     */
    public boolean isLocked() {
        if (lockedUntil == null) {
            return false;
        }
        return LocalDateTime.now().isBefore(lockedUntil);
    }

    /**
     * Lock account for specified duration (default: 30 minutes)
     */
    public void lockAccount() {
        this.lockedUntil = LocalDateTime.now().plusMinutes(30);
    }

    /**
     * Unlock account manually
     */
    public void unlockAccount() {
        this.lockedUntil = null;
        this.failedLoginCount = 0;
    }

    /**
     * Increment failed login counter
     * Lock account if threshold reached (5 attempts)
     */
    public void incrementFailedLoginCount() {
        this.failedLoginCount++;
        if (this.failedLoginCount >= 5) {
            lockAccount();
        }
    }

    /**
     * Reset failed login counter (on successful login)
     */
    public void resetFailedLoginCount() {
        this.failedLoginCount = 0;
        this.lockedUntil = null;
    }

    /**
     * Update last login timestamp
     */
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }
}
