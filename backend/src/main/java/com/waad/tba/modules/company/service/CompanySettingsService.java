package com.waad.tba.modules.company.service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waad.tba.common.exception.ResourceNotFoundException;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.modules.company.dto.CompanySettingsDto;
import com.waad.tba.modules.company.dto.UiVisibilityDto;
import com.waad.tba.modules.company.entity.CompanySettings;
import com.waad.tba.modules.company.repository.CompanySettingsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * CompanySettingsService - Phase 9 + Phase B4
 * 
 * Service for managing company settings and feature toggles.
 * Provides methods to create, update, and retrieve employer feature settings.
 * 
 * Architecture:
 * - Auto-creates default settings if none exist (never returns null)
 * - Supports per-employer feature configuration
 * - Integrates with RBAC system
 * 
 * Dependencies:
 * - CompanySettingsRepository (JPA)
 * - ObjectMapper (for JSON serialization)
 */
@Service
@RequiredArgsConstructor
public class CompanySettingsService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CompanySettingsService.class);

    private final CompanySettingsRepository repository;
    private final ObjectMapper objectMapper;
    private final OrganizationRepository organizationRepository;

    /**
     * Get settings for a specific employer.
     * If settings don't exist, creates default settings automatically.
     * 
     * @param employerId Employer ID
     * @return CompanySettings entity
     */
    @Transactional
    public CompanySettings getSettingsForEmployer(Long employerId) {
        log.debug("Getting settings for employer: {}", employerId);
        
        return repository.findByEmployerId(employerId)
                .orElseGet(() -> {
                    log.info("Settings not found for employer {}. Creating default settings.", employerId);
                    return createDefaultSettingsForEmployer(employerId, null);
                });
    }

    /**
     * Get settings for a specific employer with company validation.
     * 
     * @param companyId Company ID
     * @param employerId Employer ID
     * @return CompanySettings entity
     */
    @Transactional
    public CompanySettings getSettingsForEmployer(Long companyId, Long employerId) {
        log.debug("Getting settings for employer: {} in company: {}", employerId, companyId);
        
        return repository.findByCompanyIdAndEmployerId(companyId, employerId)
                .orElseGet(() -> {
                    log.info("Settings not found for employer {} in company {}. Creating default settings.", 
                        employerId, companyId);
                    return createDefaultSettingsForEmployer(employerId, companyId);
                });
    }

    /**
     * Create default settings for an employer.
     * Default values:
     * - canViewClaims: false (claims hidden by default)
     * - canViewVisits: false (visits hidden by default)
     * - canEditMembers: true (members editable by default)
     * - canDownloadAttachments: true (attachments downloadable by default)
     * - uiVisibility: null (nullable, to avoid SQL errors)
     * 
     * @param employerId Employer ID
     * @param companyId Company ID (optional, can be null)
     * @return Created settings entity
     */
    @Transactional
    public CompanySettings createDefaultSettingsForEmployer(Long employerId, Long companyId) {
        log.info("Creating default settings for employer: {} in company: {}", employerId, companyId);
        
        // Check if settings already exist
        if (repository.existsByEmployerId(employerId)) {
            log.warn("Settings already exist for employer: {}. Returning existing settings.", employerId);
            return repository.findByEmployerId(employerId).orElseThrow();
        }
        
        CompanySettings settings = CompanySettings.builder()
                .employerId(employerId)
                .companyId(companyId != null ? companyId : 1L) // Default to company 1 if not specified
                .uiVisibility(null)          // Null to avoid SQL errors if column doesn't exist
                .build();
        
        CompanySettings saved = repository.save(settings);
        log.info("Default settings created successfully for employer: {} with id: {}", employerId, saved.getId());
        
        return saved;
    }

    /**
     * Update settings for an employer.
     * 
     * @param employerId Employer ID
     * @param dto Settings DTO with new values
     * @return Updated settings entity
     */
    @Transactional
    public CompanySettings updateSettings(Long employerId, CompanySettingsDto dto) {
        log.info("Updating settings for employer: {}", employerId);
        
        CompanySettings settings = repository.findByEmployerId(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("CompanySettings", "employerId", employerId));
        
        // Update feature flags
        if (dto.getCanViewClaims() != null) settings.setCanViewClaims(dto.getCanViewClaims());
        if (dto.getCanViewVisits() != null) settings.setCanViewVisits(dto.getCanViewVisits());
        if (dto.getCanEditMembers() != null) settings.setCanEditMembers(dto.getCanEditMembers());
        if (dto.getCanDownloadAttachments() != null) settings.setCanDownloadAttachments(dto.getCanDownloadAttachments());
        
        // Update UI visibility if provided
        if (dto.getUiVisibility() != null) {
            settings.setUiVisibility(toUiVisibilityJson(dto.getUiVisibility()));
        }
        CompanySettings updated = repository.save(settings);
        log.info("Settings updated successfully for employer: {}", employerId);
        
        return updated;
    }

    /**
     * Get all settings for a company.
     * 
     * @param companyId Company ID
     * @return List of settings for all employers in this company
     */
    @Transactional(readOnly = true)
    public List<CompanySettings> getAllSettingsForCompany(Long companyId) {
        log.debug("Getting all settings for company: {}", companyId);
        return repository.findByCompanyId(companyId);
    }

    /**
     * Delete settings for an employer.
     * 
     * @param employerId Employer ID
     */
    @Transactional
    public void deleteSettings(Long employerId) {
        log.info("Deleting settings for employer: {}", employerId);
        
        CompanySettings settings = repository.findByEmployerId(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("CompanySettings", "employerId", employerId));
        
        repository.delete(settings);
        log.info("Settings deleted successfully for employer: {}", employerId);
    }

    /**
     * Convert entity to DTO.
     * 
     * @param settings Settings entity
     * @return Settings DTO
     */
    public CompanySettingsDto toDto(CompanySettings settings) {
        CompanySettingsDto dto = CompanySettingsDto.builder()
                .id(settings.getId())
                .companyId(settings.getCompanyId())
                .employerId(settings.getEmployerId())
                .canViewClaims(settings.getCanViewClaims())
                .canViewVisits(settings.getCanViewVisits())
                .canEditMembers(settings.getCanEditMembers())
                .canDownloadAttachments(settings.getCanDownloadAttachments())
                .build();
        
        // Populate employer name if available
        if (settings.getEmployerId() != null) {
            organizationRepository.findById(Objects.requireNonNull(settings.getEmployerId()))
                .ifPresent(employer -> {
                    dto.setEmployerName(employer.getName());
                    dto.setEmployerCode(employer.getCode());
                });
        }
        
        // Populate company name if available
        if (settings.getCompanyId() != null) {
            organizationRepository.findById(Objects.requireNonNull(settings.getCompanyId()))
                .ifPresent(company -> dto.setCompanyName(company.getName()));
        }
        
        // Parse and set UI visibility (Phase B4)
        dto.setUiVisibility(parseUiVisibility(settings.getUiVisibility()));
        
        return dto;
    }

    /**
     * Convert list of entities to DTOs.
     * 
     * @param settingsList List of settings entities
     * @return List of settings DTOs
     */
    public List<CompanySettingsDto> toDtoList(List<CompanySettings> settingsList) {
        return settingsList.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ============================================================================
    // Feature Check Methods (for AuthorizationService)
    // ============================================================================

    public boolean canEmployerViewClaims(Long employerId) {
        return getSettingsForEmployer(employerId).getCanViewClaims();
    }

    public boolean canEmployerViewVisits(Long employerId) {
        return getSettingsForEmployer(employerId).getCanViewVisits();
    }

    public boolean canEmployerEditMembers(Long employerId) {
        return getSettingsForEmployer(employerId).getCanEditMembers();
    }

    public boolean canEmployerDownloadAttachments(Long employerId) {
        return getSettingsForEmployer(employerId).getCanDownloadAttachments();
    }

    // ============================================================================

    // ============================================================================
    // Phase B4 - UI Visibility Methods
    // ============================================================================

    /**
     * Get UI visibility settings for an employer.
     * Returns default (all enabled) if not configured.
     * 
     * @param employerId Employer ID
     * @return UiVisibilityDto with visibility settings
     */
    @Transactional(readOnly = true)
    public UiVisibilityDto getUiVisibilityForEmployer(Long employerId) {
        log.debug("Getting UI visibility for employer: {}", employerId);
        CompanySettings settings = getOrCreateSettingsForEmployer(employerId);
        return parseUiVisibility(settings.getUiVisibility());
    }

    /**
     * Update UI visibility settings for an employer.
     * 
     * @param employerId Employer ID
     * @param uiVisibilityDto New visibility settings
     * @return Updated visibility settings
     */
    @Transactional
    public UiVisibilityDto updateUiVisibilityForEmployer(Long employerId, UiVisibilityDto uiVisibilityDto) {
        log.info("Updating UI visibility for employer: {}", employerId);
        CompanySettings settings = getOrCreateSettingsForEmployer(employerId);
        settings.setUiVisibility(toUiVisibilityJson(uiVisibilityDto));
        CompanySettings saved = repository.save(settings);
        log.info("UI visibility updated successfully for employer: {}", employerId);
        return parseUiVisibility(saved.getUiVisibility());
    }

    /**
     * Helper to get or create settings for an employer.
     * Used by UI visibility methods.
     */
    private CompanySettings getOrCreateSettingsForEmployer(Long employerId) {
        return repository.findByEmployerId(employerId)
            .orElseGet(() -> {
                log.info("Settings not found for employer {}. Creating with defaults.", employerId);
                CompanySettings created = new CompanySettings();
                created.setEmployerId(employerId);
                created.setCompanyId(1L); // Default company ID
                created.setUiVisibility(null); // Null to avoid SQL errors
                return repository.save(created);
            });
    }

    /**
     * Parse JSON string to UiVisibilityDto.
     * Returns default (all enabled) if JSON is empty or invalid.
     */
    private UiVisibilityDto parseUiVisibility(String json) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return UiVisibilityDto.defaultAllEnabled();
        }
        try {
            return objectMapper.readValue(json, UiVisibilityDto.class);
        } catch (Exception ex) {
            log.warn("Failed to parse UI visibility JSON: {}. Using defaults.", ex.getMessage());
            return UiVisibilityDto.defaultAllEnabled();
        }
    }

    /**
     * Convert UiVisibilityDto to JSON string.
     * Returns empty JSON {} if DTO is null or serialization fails.
     */
    private String toUiVisibilityJson(UiVisibilityDto dto) {
        if (dto == null) {
            dto = UiVisibilityDto.defaultAllEnabled();
        }
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize UI visibility DTO: {}. Using empty JSON.", ex.getMessage());
            return "{}";
        }
    }
}
