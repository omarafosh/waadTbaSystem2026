package com.waad.tba.modules.provider.entity;

import com.waad.tba.common.entity.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * الجهات المسموحة لمقدم خدمة معين.
 * 
 * يمثل العلاقة بين مقدم الخدمة والجهات التي يُسمح لها بالتعامل معه.
 * يتم التحكم في هذه القائمة من قِبل شركة وعد TPA.
 */
@Entity
@Table(name = "provider_allowed_employers",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_pae_provider_employer",
        columnNames = {"provider_id", "employer_id"}
    ),
    indexes = {
        @Index(name = "idx_pae_provider", columnList = "provider_id"),
        @Index(name = "idx_pae_employer", columnList = "employer_id"),
        @Index(name = "idx_pae_active", columnList = "active")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderAllowedEmployer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Organization employer;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
