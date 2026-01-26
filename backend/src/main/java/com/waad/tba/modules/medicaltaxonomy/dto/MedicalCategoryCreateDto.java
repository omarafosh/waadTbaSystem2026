package com.waad.tba.modules.medicaltaxonomy.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new Medical Category.
 * 
 * Field Mapping:
 * - Frontend: categoryCode → Backend: code
 * - Frontend: nameAr → Backend: name
 * - Frontend: parentCategoryId → Backend: parentId
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCategoryCreateDto {

    /**
     * Unique category code (immutable)
     * Examples: "CONSULTATION", "SURGERY", "CARDIOLOGY_CONSULT"
     */
    @NotBlank(message = "Category code is required")
    @Size(max = 50, message = "Category code must not exceed 50 characters")
    @JsonAlias({"categoryCode", "code"})
    private String code;

    /**
     * Arabic name (primary)
     */
    @NotBlank(message = "Category name is required")
    @Size(max = 200, message = "Category name must not exceed 200 characters")
    @JsonAlias({"nameAr", "name"})
    private String name;

    /**
     * English name (supplementary)
     */
    @Size(max = 200, message = "English name must not exceed 200 characters")
    @JsonAlias({"nameEn"})
    private String nameEn;

    /**
     * Parent category ID (null for root categories)
     */
    @JsonAlias({"parentCategoryId", "parentId"})
    private Long parentId;

    /**
     * Active status (defaults to true)
     */
    @Builder.Default
    private Boolean active = true;
}
