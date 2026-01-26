package com.waad.tba.modules.medicaltaxonomy.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating a Medical Category.
 * 
 * Note: 'code' is immutable and cannot be changed.
 * All fields are optional (partial update).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCategoryUpdateDto {

    /**
     * Arabic name (primary)
     */
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
     * Parent category ID (null to make root category)
     */
    @JsonAlias({"parentCategoryId", "parentId"})
    private Long parentId;

    /**
     * Active status
     */
    private Boolean active;
}
