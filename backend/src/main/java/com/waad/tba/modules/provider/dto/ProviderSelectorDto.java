package com.waad.tba.modules.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderSelectorDto {
    private Long id;
    private String code;
    /**
     * Display name (uses Arabic name)
     */
    private String name;
    private String nameArabic;
    private String nameEnglish;
    /**
     * Provider type (HOSPITAL, CLINIC, LAB, PHARMACY)
     * Used in dropdown to show provider category
     */
    private String providerType;
}
