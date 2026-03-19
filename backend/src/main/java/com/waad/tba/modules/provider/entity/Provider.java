package com.waad.tba.modules.provider.entity;

import com.waad.tba.modules.providercontract.entity.ProviderContract;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;

@Entity
@Table(name = "providers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Provider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Provider name (اسم مقدم الخدمة)
     * Unified single name field
     */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(unique = true, nullable = false, length = 100)
    private String licenseNumber;

    @Column(length = 50)
    private String taxNumber;

    @Column(length = 100)
    private String city;

    @Column(length = 500)
    private String address;

    @Column(length = 50)
    private String phone;

    @Column(length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProviderType providerType;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private NetworkTier networkStatus;

    private LocalDate contractStartDate;

    private LocalDate contractEndDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal defaultDiscountRate;

    /**
     * TPA Model: Specific employers allowed for this provider
     * (Without a formal contract for each)
     */
    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, orphanRemoval = true)
    // ⚡ Bolt: Added @BatchSize to prevent N+1 queries when loading this collection
    @org.hibernate.annotations.BatchSize(size = 25)
    @Builder.Default
    private List<ProviderAllowedEmployer> allowedEmployers = new ArrayList<>();
    @Column(name = "allow_all_employers", nullable = false)
    @Builder.Default
    private Boolean allowAllEmployers = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(length = 100)
    private String createdBy;

    @Column(length = 100)
    private String updatedBy;

    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, orphanRemoval = true)
    // ⚡ Bolt: Added @BatchSize to prevent N+1 queries when loading this collection
    @org.hibernate.annotations.BatchSize(size = 25)
    @Builder.Default
    private List<ProviderContract> contracts = new ArrayList<>();





    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ProviderType {
        HOSPITAL,
        CLINIC,
        LAB,
        PHARMACY,
        RADIOLOGY
    }

    /**
     * Network Tier for Insurance Providers
     * - IN_NETWORK: Provider has contract with insurance (معتمد داخل الشبكة)
     * - OUT_OF_NETWORK: Provider not contracted (خارج الشبكة)
     * - PREFERRED: Preferred provider with better rates (مزود مفضل)
     */
    public enum NetworkTier {
        IN_NETWORK,
        OUT_OF_NETWORK,
        PREFERRED
    }
}
