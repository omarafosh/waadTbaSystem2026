package com.waad.tba.modules.company.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CompanySettingsDto - Phase 9
 * 
 * Data Transfer Object for company settings.
 * Used for API requests/responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanySettingsDto {
    
    private Long id;
    
    @NotNull(message = "Company ID is required")
    private Long companyId;
    
    @NotNull(message = "Employer ID is required")
    private Long employerId;
    
    private Boolean canViewClaims;
    private Boolean canViewVisits;
    private Boolean canEditMembers;
    private Boolean canDownloadAttachments;
    /**
     * Employer name (for display purposes)
     */
    private String employerName;
    
    /**
     * Employer code (for filtering and identification)
     */
    private String employerCode;
    
    /**
     * Company name (for display purposes)
     */
    private String companyName;
    
    /**
     * UI visibility configuration (Phase B4)
     */
    private UiVisibilityDto uiVisibility;
}
