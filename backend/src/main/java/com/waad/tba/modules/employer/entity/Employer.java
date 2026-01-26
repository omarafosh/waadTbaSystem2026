package com.waad.tba.modules.employer.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
/**
 * Legacy employer entity - READ ONLY.
 * 
 * @deprecated Use {@link com.waad.tba.common.entity.Organization} with type=EMPLOYER instead.
 *             This entity is kept for backward compatibility only. All new code must use Organization.
 *             Writing to this entity is prohibited - use Organization with OrganizationType.EMPLOYER.
 */
@Deprecated
@Entity
@Table(name = "employers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Employer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Employer code is required")
    @Column(nullable = false, unique = true)
    private String code;

    @NotBlank(message = "Employer name (Arabic) is required")
    @Column(nullable = false, name = "name_ar")
    private String nameAr;

    @NotBlank(message = "Employer name (English) is required")
    @Column(nullable = false, name = "name_en")
    private String nameEn;
    
    private String address;

    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    @Builder.Default
    private Boolean active = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
