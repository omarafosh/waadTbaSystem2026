package com.waad.tba.modules.claim.entity;

import com.waad.tba.modules.medicaltaxonomy.entity.MedicalService;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * ClaimLine Entity (CANONICAL REBUILD 2026-01-16)
 * 
 * ARCHITECTURAL LAW:
 * - Each line MUST reference a MedicalService (FK) - NO free-text services
 * - Unit price is AUTO-RESOLVED from Provider Contract - NO manual entry
 * - Total price is SERVER-CALCULATED: quantity × unitPrice
 * 
 * Data Flow: MedicalService (from Contract) → ContractPrice (auto) → TotalPrice (calculated)
 */
@Entity
@Table(name = "claim_lines", indexes = {
    @Index(name = "idx_claim_line_service", columnList = "medical_service_id"),
    @Index(name = "idx_claim_line_claim", columnList = "claim_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    // ==================== MEDICAL SERVICE (CONTRACT-DRIVEN) ====================
    
    /**
     * Medical Service (FK)
     * ARCHITECTURAL LAW: Service MUST be selected from Provider Contract - NO free-text
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_service_id", nullable = false)
    private MedicalService medicalService;

    /**
     * Service code (denormalized snapshot for reports/queries)
     */
    @Column(name = "service_code", length = 50, nullable = false)
    private String serviceCode;
    
    /**
     * Service name (denormalized snapshot at claim time)
     */
    @Column(name = "service_name", length = 255)
    private String serviceName;
    
    /**
     * Service category ID (denormalized for filtering)
     */
    @Column(name = "service_category_id")
    private Long serviceCategoryId;

    // ==================== QUANTITY & PRICING ====================

    /**
     * Quantity of service
     */
    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    /**
     * Unit price from Provider Contract (READ-ONLY, auto-resolved)
     * ARCHITECTURAL LAW: This is NOT user-editable
     */
    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    /**
     * Total price (SERVER-CALCULATED: quantity × unitPrice)
     * ARCHITECTURAL LAW: This is auto-calculated, not user-entered
     */
    @Column(name = "total_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalPrice;
    
    /**
     * Whether service requires pre-authorization (snapshot from MedicalService)
     */
    @Column(name = "requires_pa")
    @Builder.Default
    private Boolean requiresPA = false;

    // ==================== LIFECYCLE HOOKS ====================

    @PrePersist
    private void prePersist() {
        populateDenormalizedFields();
        calculateTotalPrice();
        validateArchitecturalRules();
    }
    
    @PreUpdate
    private void preUpdate() {
        calculateTotalPrice();
    }
    
    /**
     * Populate denormalized fields from MedicalService
     */
    private void populateDenormalizedFields() {
        if (medicalService != null) {
            this.serviceCode = medicalService.getCode();
            this.serviceName = medicalService.getName();
            this.serviceCategoryId = medicalService.getCategoryId();
            this.requiresPA = medicalService.isRequiresPA();
        }
    }

    /**
     * Calculate total price from quantity and unit price
     */
    private void calculateTotalPrice() {
        if (quantity != null && unitPrice != null) {
            totalPrice = unitPrice.multiply(new BigDecimal(quantity));
        }
    }
    
    /**
     * Validate architectural rules
     */
    private void validateArchitecturalRules() {
        // RULE: MedicalService is MANDATORY
        if (medicalService == null) {
            throw new IllegalStateException("ARCHITECTURAL VIOLATION: ClaimLine MUST reference a MedicalService");
        }
        
        // RULE: Unit price must be set (from contract)
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("ARCHITECTURAL VIOLATION: Unit price must be resolved from Provider Contract");
        }
        
        // RULE: Quantity must be positive
        if (quantity == null || quantity <= 0) {
            throw new IllegalStateException("Quantity must be a positive number");
        }
    }
}
