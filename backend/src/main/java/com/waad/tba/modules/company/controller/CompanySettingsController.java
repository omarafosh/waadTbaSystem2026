package com.waad.tba.modules.company.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.waad.tba.modules.company.dto.CompanySettingsDto;
import com.waad.tba.modules.company.dto.UiVisibilityDto;
import com.waad.tba.modules.company.entity.CompanySettings;
import com.waad.tba.modules.company.service.CompanySettingsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * CompanySettingsController - Phase 9 + Phase B4
 * 
 * REST API endpoints for company settings and feature toggles.
 * Handles employer-level configuration and UI visibility settings.
 * 
 * CRITICAL FIX:
 * - Added /api prefix to match frontend expectations
 * - Ensures proper Spring MVC routing (not static resource)
 * - Package: com.waad.tba.modules.company.controller (scanned by @SpringBootApplication)
 */
@Slf4j
@RestController
@RequestMapping("/api/company-settings")
@RequiredArgsConstructor
@Tag(name = "Company Settings", description = "Company Settings and Feature Toggles API")
public class CompanySettingsController {

    private final CompanySettingsService companySettingsService;

    /**
     * Get feature toggle settings for an employer.
     * 
     * RBAC:
     * - SUPER_ADMIN: Can view any employer's settings
     * - INSURANCE_ADMIN: Can view any employer's settings
     * - EMPLOYER_ADMIN: Can view only their own employer's settings (validated in service layer)
     * 
     * @param employerId Employer ID
     * @return CompanySettingsDto with feature toggles
     */
    @GetMapping("/employer/{employerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INSURANCE_ADMIN', 'EMPLOYER_ADMIN')")
    @Operation(summary = "Get settings for employer", 
               description = "Retrieve feature toggle settings for a specific employer")
    public ResponseEntity<CompanySettingsDto> getSettingsForEmployer(@PathVariable Long employerId) {
        log.info("REST request: GET /api/company-settings/employer/{}", employerId);
        
        try {
            CompanySettings settings = companySettingsService.getSettingsForEmployer(employerId);
            CompanySettingsDto dto = companySettingsService.toDto(settings);
            
            log.info("✅ Successfully retrieved settings for employer {}: canViewClaims={}, canViewVisits={}", 
                employerId, dto.getCanViewClaims(), dto.getCanViewVisits());
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("❌ Error retrieving settings for employer {}: {}", employerId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Update feature toggle settings for an employer.
     * 
     * RBAC:
     * - SUPER_ADMIN: Can update any employer's settings
     * - INSURANCE_ADMIN: Can update any employer's settings
     * - EMPLOYER_ADMIN: Can update only their own employer's settings (validated in service layer)
     * 
     * @param employerId Employer ID
     * @param dto Settings DTO with new values
     * @return Updated settings
     */
    @PutMapping("/employer/{employerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INSURANCE_ADMIN', 'EMPLOYER_ADMIN')")
    @Operation(summary = "Update settings for employer", 
               description = "Update feature toggle settings for a specific employer")
    public ResponseEntity<CompanySettingsDto> updateSettings(
            @PathVariable Long employerId,
            @Valid @RequestBody CompanySettingsDto dto) {
        log.info("REST request: PUT /api/company-settings/employer/{}", employerId);
        log.debug("Update payload: {}", dto);
        
        try {
            CompanySettings updated = companySettingsService.updateSettings(employerId, dto);
            CompanySettingsDto result = companySettingsService.toDto(updated);
            
            log.info("✅ Successfully updated settings for employer {}", employerId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ Error updating settings for employer {}: {}", employerId, e.getMessage(), e);
            throw e;
        }
    }

    // ============================================================================
    // Phase B4 - UI Visibility Endpoints
    // ============================================================================

    /**
     * Get UI visibility settings for an employer.
     * 
     * RBAC:
     * - SUPER_ADMIN: Can view any employer's UI settings
     * - INSURANCE_ADMIN: Can view any employer's UI settings
     * - EMPLOYER_ADMIN: Can view only their own employer's UI settings (validated in service layer)
     * 
     * @param employerId Employer ID
     * @return UiVisibilityDto with visibility settings
     */
    @GetMapping("/employer/{employerId}/ui")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INSURANCE_ADMIN', 'EMPLOYER_ADMIN')")
    @Operation(summary = "Get UI visibility settings", 
               description = "Retrieve UI visibility configuration for a specific employer")
    public ResponseEntity<UiVisibilityDto> getUiVisibility(@PathVariable Long employerId) {
        log.info("REST request: GET /api/company-settings/employer/{}/ui", employerId);
        
        try {
            UiVisibilityDto dto = companySettingsService.getUiVisibilityForEmployer(employerId);
            log.info("✅ Successfully retrieved UI visibility for employer {}", employerId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("❌ Error retrieving UI visibility for employer {}: {}", employerId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Update UI visibility settings for an employer.
     * 
     * RBAC:
     * - SUPER_ADMIN: Can update any employer's UI settings
     * - INSURANCE_ADMIN: Can update any employer's UI settings
     * - EMPLOYER_ADMIN: Can update only their own employer's UI settings (validated in service layer)
     * 
     * @param employerId Employer ID
     * @param uiVisibilityDto New visibility settings
     * @return Updated visibility settings
     */
    @PutMapping("/employer/{employerId}/ui")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INSURANCE_ADMIN', 'EMPLOYER_ADMIN')")
    @Operation(summary = "Update UI visibility settings", 
               description = "Update UI visibility configuration for a specific employer")
    public ResponseEntity<UiVisibilityDto> updateUiVisibility(
            @PathVariable Long employerId,
            @Valid @RequestBody UiVisibilityDto uiVisibilityDto) {
        log.info("REST request: PUT /api/company-settings/employer/{}/ui", employerId);
        log.debug("UI visibility payload: {}", uiVisibilityDto);
        
        try {
            UiVisibilityDto updated = companySettingsService.updateUiVisibilityForEmployer(employerId, uiVisibilityDto);
            log.info("✅ Successfully updated UI visibility for employer {}", employerId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("❌ Error updating UI visibility for employer {}: {}", employerId, e.getMessage(), e);
            throw e;
        }
    }
}
