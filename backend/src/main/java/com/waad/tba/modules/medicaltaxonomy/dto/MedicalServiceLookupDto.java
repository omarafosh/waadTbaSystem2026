package com.waad.tba.modules.medicaltaxonomy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MedicalServiceLookupDto - Canonical Lookup DTO for Medical Service Selection
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARCHITECTURAL LAW (NON-NEGOTIABLE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MedicalService MUST always be represented as:
 *   CODE + NAME + CATEGORY
 * 
 * Anywhere a service is selectable or displayed.
 * 
 * NO EXCEPTIONS.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Used in:
 * - Provider Contract form (Pricing Item selector)
 * - Benefit Policy Rule form (Service selector)
 * - Provider Portal (Claim / PreAuth service lines)
 * 
 * Display format:
 *   [SVC-001] أشعة مقطعية CT Scan
 *   🗂 التصنيف: الأشعة التشخيصية
 * 
 * Searchable by:
 * - code
 * - nameAr
 * - nameEn
 * - categoryNameAr
 * - categoryNameEn
 * 
 * @author TBA WAAD System
 * @version 2025.1
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalServiceLookupDto {

    /**
     * Service ID - the ONLY value to be persisted
     */
    private Long id;

    /**
     * Service code (business identifier)
     * Format: "SRV-CARDIO-001", "SRV-LAB-CBC"
     */
    private String code;

    /**
     * Arabic name (primary)
     */
    private String nameAr;

    /**
     * English name (supplementary)
     */
    private String nameEn;

    /**
     * Category ID (for filtering)
     */
    private Long categoryId;

    /**
     * Category Arabic name (for display)
     */
    private String categoryNameAr;

    /**
     * Category English name (for display)
     */
    private String categoryNameEn;

    /**
     * Display label combining code and name
     * Format: "[SVC-001] أشعة مقطعية"
     */
    public String getDisplayLabel() {
        return String.format("[%s] %s", code, nameAr != null ? nameAr : nameEn);
    }

    /**
     * Full display with category
     * Format: "[SVC-001] أشعة مقطعية - الأشعة التشخيصية"
     */
    public String getFullDisplayLabel() {
        String category = categoryNameAr != null ? categoryNameAr : 
                         categoryNameEn != null ? categoryNameEn : "غير مصنف";
        return String.format("[%s] %s - %s", code, nameAr != null ? nameAr : nameEn, category);
    }
}
