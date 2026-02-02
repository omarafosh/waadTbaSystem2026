package com.waad.tba.modules.employer.service;

import com.waad.tba.common.entity.Organization;
import com.waad.tba.common.enums.OrganizationType;
import com.waad.tba.common.exception.BusinessRuleException;
import com.waad.tba.common.exception.ResourceNotFoundException;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.modules.employer.dto.EmployerCreateDto;
import com.waad.tba.modules.employer.dto.EmployerResponseDto;
import com.waad.tba.modules.employer.dto.EmployerSelectorDto;
import com.waad.tba.modules.employer.dto.EmployerUpdateDto;
import com.waad.tba.modules.employer.mapper.EmployerMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * Employer Service - Phase 2 Implementation
 * 
 * Features:
 * - Auto-code generation (EMP-01, EMP-02, ...)
 * - Field normalization (name ↔ nameAr)
 * - Validation and error handling
 * - Uses Organization Entity (CANONICAL)
 * 
 * This service is a facade over {@link Organization} with type=EMPLOYER.
 * All CRUD operations work with Organization table only.
 * 
 * ✅ READS: OrganizationRepository.findByType(EMPLOYER)
 * ✅ WRITES: OrganizationRepository.save() with type=EMPLOYER
 * ❌ NEVER uses legacy EmployerRepository for writes
 * 
 * @see Organization
 * @see OrganizationType#EMPLOYER
 * @see EMPLOYER_API_CONTRACT.md
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmployerService {

    private static final String EMPLOYER_CODE_PREFIX = "EMP-";
    private static final String EMPLOYER_CODE_PATTERN = "EMP-%";
    private static final int EMPLOYER_CODE_LENGTH = 2; // EMP-01, EMP-02, etc.

    private final OrganizationRepository organizationRepository;
    private final EmployerMapper mapper;
    private final com.waad.tba.modules.benefitpolicy.repository.BenefitPolicyRepository benefitPolicyRepository;
    private final com.waad.tba.modules.member.repository.MemberRepository memberRepository;

    /**
     * Get all active, non-archived employers
     */
    /**
     * Get all active, non-archived employers (Paginated & Searchable)
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<EmployerResponseDto> getAll(org.springframework.data.domain.Pageable pageable, String search, Boolean deleted, Boolean active) {
        boolean isArchived = Boolean.TRUE.equals(deleted);
        
        org.springframework.data.domain.Page<Organization> page;
        
        if (search != null && !search.trim().isEmpty()) {
            if (active != null) {
                page = organizationRepository.searchByTypeAndArchivedAndActive(search.trim(), OrganizationType.EMPLOYER, isArchived, active, pageable);
            } else {
                page = organizationRepository.searchByTypeAndArchived(search.trim(), OrganizationType.EMPLOYER, isArchived, pageable);
            }
        } else {
            if (active != null) {
                page = organizationRepository.findByTypeAndArchivedAndActive(OrganizationType.EMPLOYER, isArchived, active, pageable);
            } else {
                page = organizationRepository.findByTypeAndArchived(OrganizationType.EMPLOYER, isArchived, pageable);
            }
        }

        return page.map(this::mapToResponseWithPolicy);
    }

    /**
     * Get all active, non-archived employers (Legacy List)
     */
    @Transactional(readOnly = true)
    public List<EmployerResponseDto> getAll(Boolean deleted, Boolean active) {
        return organizationRepository.findByType(OrganizationType.EMPLOYER)
                .stream()
                .filter(org -> (deleted == null || org.isArchived() == deleted))
                .filter(org -> (active == null || org.isActive() == active))
                .map(this::mapToResponseWithPolicy)
                .toList();
    }

    /**
     * Get all employers including archived ones
     * 
     * @deprecated Use getAll(Boolean deleted) instead
     */
    @Transactional(readOnly = true)
    public List<EmployerResponseDto> getAllIncludingArchived() {
        return organizationRepository.findByType(OrganizationType.EMPLOYER)
                .stream()
                .map(this::mapToResponseWithPolicy)
                .toList();
    }

    /**
     * Get employer selectors (for dropdowns) - excludes archived
     */
    @Transactional(readOnly = true)
    public List<EmployerSelectorDto> getSelectors() {
        return organizationRepository.findByTypeAndActiveTrue(OrganizationType.EMPLOYER)
                .stream()
                .filter(org -> !org.isArchived())
                .map(mapper::toSelector)
                .toList();
    }

    /**
     * Get employer by ID
     */
    @Transactional(readOnly = true)
    public EmployerResponseDto getById(Long id) {
        Organization org = findEmployerById(id);
        return mapToResponseWithPolicy(org);
    }

    /**
     * Create new employer with auto-code generation
     * 
     * Phase 2 Features:
     * - Auto-generates code if not provided (EMP-01, EMP-02, ...)
     * - Normalizes field names (accepts 'employerCode' or 'code', 'nameAr' or
     * 'name')
     * - Validates uniqueness of code
     * - Sets default active=true
     * 
     * @param dto EmployerCreateDto (code is optional)
     * @return Created employer response
     * @throws BusinessRuleException if code already exists
     */
    @Transactional
    public EmployerResponseDto create(EmployerCreateDto dto) {
        log.info("[EmployerService] Creating employer with name: {}", dto.getName());

        // Step 1: Normalize and generate code if needed
        String employerCode = normalizeAndGenerateCode(dto.getCode());
        log.debug("[EmployerService] Normalized/Generated code: {}", employerCode);

        // Step 2: Validate code and name uniqueness
        validateCodeUniqueness(employerCode, null);
        validateNameUniqueness(dto.getName(), null);

        // Step 3: Build Organization entity (Arabic name only)
        Organization org = Organization.builder()
                .code(employerCode)
                .name(dto.getName()) // Arabic name (primary and only)
                .type(OrganizationType.EMPLOYER)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        // Step 4: Persist and return
        Organization saved = organizationRepository.save(org);
        log.info("[EmployerService] Created employer with ID: {} and code: {}", saved.getId(), saved.getCode());

        return mapToResponseWithPolicy(saved);
    }

    /**
     * Update existing employer
     * 
     * Phase 2 Features:
     * - Normalizes field names
     * - Validates code uniqueness (if changed)
     * - Updates mutable fields only (name, active)
     * - Preserves auto-generated codes (warning logged if code changes)
     * 
     * @param id  Employer ID
     * @param dto EmployerUpdateDto
     * @return Updated employer response
     * @throws ResourceNotFoundException if employer not found
     * @throws BusinessRuleException     if code conflict
     */
    @Transactional
    public EmployerResponseDto update(Long id, EmployerUpdateDto dto) {
        log.info("[EmployerService] Updating employer ID: {}", id);

        // Step 1: Find existing employer
        Organization org = findEmployerById(id);
        String oldCode = org.getCode();

        if (!oldCode.equals(dto.getCode())) {
            log.warn("[EmployerService] Changing employer code from {} to {} for ID: {}",
                    oldCode, dto.getCode(), id);
            validateCodeUniqueness(dto.getCode(), id);
        }

        // Validate name uniqueness if changed
        if (!org.getName().equals(dto.getName())) {
            validateNameUniqueness(dto.getName(), id);
        }

        // Step 3: Update mutable fields (Arabic name only)
        org.setCode(dto.getCode());
        org.setName(dto.getName()); // Arabic name (primary and only)

        if (dto.getActive() != null) {
            org.setActive(dto.getActive());
        }

        // Step 4: Persist and return
        Organization updated = organizationRepository.save(org);
        log.info("[EmployerService] Updated employer ID: {}", id);

        return mapper.toResponse(updated);
    }

    /**
     * Delete employer - DISABLED
     * 
     * Employers cannot be deleted because they are linked to:
     * - Members
     * - Benefit Policies
     * - Claims
     * - Providers
     * 
     * Use archive() instead to safely hide employers from lists while preserving
     * data integrity.
     * 
     * @param id Employer ID
     * @throws BusinessRuleException Always throws - delete is not allowed
     */
    @Transactional
    public void delete(Long id) {
        throw new BusinessRuleException(
                "لا يمكن حذف الشريك. استخدم الأرشفة بدلاً من ذلك. "
                        + "Employer cannot be deleted. Use archive instead to preserve system integrity.");
    }

    /**
     * Archive employer (safe alternative to delete)
     * 
     * Sets archived=true, hiding employer from default lists while keeping:
     * - All database records intact
     * - Member relationships
     * - Benefit Policy relationships
     * - Claim history
     * - Provider links
     * 
     * @param id Employer ID
     * @return Updated employer response
     * @throws ResourceNotFoundException if employer not found
     */
    @Transactional
    public EmployerResponseDto archive(Long id) {
        log.info("[EmployerService] Archiving employer ID: {}", id);

        Organization org = findEmployerById(id);

        if (org.isArchived()) {
            log.warn("[EmployerService] Employer ID: {} is already archived", id);
        }

        org.setArchived(true);
        Organization updated = organizationRepository.save(org);

        log.info("[EmployerService] Archived employer ID: {}", id);
        return mapToResponseWithPolicy(updated);
    }

    /**
     * Restore archived employer
     * 
     * Sets archived=false, making employer visible again in default lists.
     * 
     * @param id Employer ID
     * @return Updated employer response
     * @throws ResourceNotFoundException if employer not found
     */
    @Transactional
    public EmployerResponseDto restore(Long id) {
        log.info("[EmployerService] Restoring employer ID: {}", id);

        Organization org = findEmployerById(id);

        if (!org.isArchived()) {
            log.warn("[EmployerService] Employer ID: {} is not archived", id);
        }

        org.setArchived(false);
        Organization updated = organizationRepository.save(org);

        log.info("[EmployerService] Restored employer ID: {}", id);
        return mapToResponseWithPolicy(updated);
    }

    /**
     * Count active employers
     */
    public long count() {
        return organizationRepository.countByTypeAndActiveTrue(OrganizationType.EMPLOYER);
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    /**
     * Find employer by ID, ensuring it's of type EMPLOYER
     * 
     * @param id Employer ID
     * @return Organization entity
     * @throws ResourceNotFoundException if not found or not an employer
     */
    private Organization findEmployerById(Long id) {
        return organizationRepository.findById(id)
                .filter(o -> o.getType() == OrganizationType.EMPLOYER)
                .orElseThrow(() -> new ResourceNotFoundException("جهة العمل غير موجودة للمعرف: " + id));
    }

    /**
     * Normalize code and generate if null/empty
     * 
     * Auto-Code Generation Logic:
     * 1. Query max code with pattern EMP-%
     * 2. Extract numeric suffix
     * 3. Increment by 1
     * 4. Format as EMP-XX (zero-padded)
     * 
     * Examples:
     * - No existing codes → EMP-01
     * - Max code EMP-03 → EMP-04
     * - Max code EMP-99 → EMP-100 (grows as needed)
     * 
     * @param providedCode Code from DTO (may be null)
     * @return Normalized code or auto-generated code
     */
    private String normalizeAndGenerateCode(String providedCode) {
        // If code provided, use it (trim whitespace)
        if (providedCode != null && !providedCode.trim().isEmpty()) {
            return providedCode.trim();
        }

        // Auto-generate code
        log.debug("[EmployerService] Auto-generating employer code...");

        List<String> codes = organizationRepository.findMaxCodeByTypeAndPrefix(
                OrganizationType.EMPLOYER,
                EMPLOYER_CODE_PATTERN);

        int nextNumber = 1; // Default: EMP-01

        if (!codes.isEmpty()) {
            String maxCode = codes.get(0); // First result is max (DESC order)
            log.debug("[EmployerService] Max existing code: {}", maxCode);

            try {
                // Extract numeric suffix (e.g., "EMP-03" → "03" → 3)
                String suffix = maxCode.substring(EMPLOYER_CODE_PREFIX.length());
                int currentMax = Integer.parseInt(suffix);
                nextNumber = currentMax + 1;
            } catch (Exception e) {
                log.warn("[EmployerService] Failed to parse existing code: {}. Using default.", maxCode, e);
            }
        }

        String generatedCode = String.format("%s%0" + EMPLOYER_CODE_LENGTH + "d", EMPLOYER_CODE_PREFIX, nextNumber);
        log.info("[EmployerService] Auto-generated employer code: {}", generatedCode);

        return generatedCode;
    }

    /**
     * Validate code uniqueness
     * 
     * @param code      Code to validate
     * @param excludeId ID to exclude from check (for updates)
     * @throws BusinessRuleException if code already exists
     */
    private void validateCodeUniqueness(String code, Long excludeId) {
        Optional<Organization> existing = organizationRepository.findByCode(code);

        if (existing.isPresent()) {
            Organization existingOrg = existing.get();

            // If updating, allow same code for same ID
            if (excludeId != null && existingOrg.getId().equals(excludeId)) {
                return;
            }

            log.error("[EmployerService] Code already exists: {}", code);
            throw new BusinessRuleException("رمز جهة العمل موجود مسبقاً: " + code);
        }
    }

    /**
     * Validate name uniqueness
     * 
     * @param name      Name to validate
     * @param excludeId ID to exclude from check (for updates)
     * @throws BusinessRuleException if name already exists
     */
    private void validateNameUniqueness(String name, Long excludeId) {
        // Query as case-insensitive to prevent subtle duplicates
        Optional<Organization> existing = organizationRepository.findByType(OrganizationType.EMPLOYER)
                .stream()
                .filter(org -> org.getName().equalsIgnoreCase(name.trim()))
                .findFirst();

        if (existing.isPresent()) {
            Organization existingOrg = existing.get();

            // If updating, allow same name for same ID
            if (excludeId != null && existingOrg.getId().equals(excludeId)) {
                return;
            }

            log.error("[EmployerService] Employer name already exists (case-insensitive): {}", name);
            throw new BusinessRuleException("اسم جهة العمل موجود مسبقاً (بنفس الأحرف): " + name);
        }
    }

    /**
     * Helper to map Organization to EmployerResponseDto with active policy info and statistics
     */
    private EmployerResponseDto mapToResponseWithPolicy(Organization org) {
        if (org == null) return null;
        EmployerResponseDto dto = mapper.toResponse(org);

        try {
            // ========================================
            // STATISTICS: Count members with ACTIVE benefit policies
            // ========================================
            long membersCount = memberRepository.countByEmployerOrganizationIdAndBenefitPolicyStatusAndBenefitPolicyActiveTrue(
                    org.getId(), 
                    com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy.BenefitPolicyStatus.ACTIVE);
            dto.setTotalMembers(membersCount);

            // Strategy 1: Find by ID (Primary)
            List<com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy> policies = 
                    benefitPolicyRepository.findByEmployerOrganizationIdAndActiveTrue(org.getId());

            // Strategy 2: Fallback to Name (Secondary/Diagnostic)
            // Useful if there are multiple org records with the same name but different IDs
            if (policies.isEmpty() && org.getName() != null) {
                policies = benefitPolicyRepository.findByEmployerOrganizationNameAndActiveTrue(org.getName());
            }

            // Count active policies (ACTIVE status and within effective dates)
            int activePoliciesCount = (int) policies.stream()
                    .filter(p -> p.getStatus() == com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy.BenefitPolicyStatus.ACTIVE)
                    .filter(com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy::isEffective)
                    .count();
            dto.setActivePoliciesCount(activePoliciesCount);

            // Filter for ACTIVE status and Effective dates
            Optional<com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy> activePolicy = policies.stream()
                    .filter(p -> p.getStatus() == com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy.BenefitPolicyStatus.ACTIVE)
                    .filter(com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy::isEffective)
                    .sorted((p1, p2) -> {
                        if (p1.getCreatedAt() == null) return 1;
                        if (p2.getCreatedAt() == null) return -1;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt());
                    })
                    .findFirst();
            
            // If no ACTIVE policy found, fallback to DRAFT (most recent)
            if (activePolicy.isEmpty()) {
                activePolicy = policies.stream()
                        .filter(p -> p.getStatus() == com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy.BenefitPolicyStatus.DRAFT)
                        .sorted((p1, p2) -> {
                            if (p1.getCreatedAt() == null) return 1;
                            if (p2.getCreatedAt() == null) return -1;
                            return p2.getCreatedAt().compareTo(p1.getCreatedAt());
                        })
                        .findFirst();
            }
            
            activePolicy.ifPresent(policy -> {
                dto.setActivePolicyName(policy.getName());
                dto.setActivePolicyId(policy.getId());
            });
        } catch (Exception e) {
            log.error("[EmployerService] Failed to map policy/statistics for employer {}: {}", org.getId(), e.getMessage());
            // Set defaults on error
            dto.setTotalMembers(0L);
            dto.setActivePoliciesCount(0);
        }

        return dto;
    }

}
