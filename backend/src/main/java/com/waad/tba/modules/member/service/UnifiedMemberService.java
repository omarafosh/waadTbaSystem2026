package com.waad.tba.modules.member.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.waad.tba.common.entity.Organization;
import com.waad.tba.common.exception.BusinessRuleException;
import com.waad.tba.common.exception.ResourceNotFoundException;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy;
import com.waad.tba.modules.benefitpolicy.repository.BenefitPolicyRepository;
import com.waad.tba.modules.member.dto.DependentMemberDto;
import com.waad.tba.modules.member.dto.FamilyEligibilityResponseDto;
import com.waad.tba.modules.member.dto.MemberCreateDto;
import com.waad.tba.modules.member.dto.MemberUpdateDto;
import com.waad.tba.modules.member.dto.MemberViewDto;
import com.waad.tba.modules.member.entity.Member;
import com.waad.tba.modules.member.mapper.UnifiedMemberMapper;
import com.waad.tba.modules.member.repository.MemberRepository;
import com.waad.tba.security.AuthorizationService;
import com.waad.tba.modules.rbac.entity.User;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ==================== UNIFIED MEMBER ARCHITECTURE ====================
 * Service for managing members in the unified architecture.
 * 
 * Handles:
 * - Creating PRINCIPAL members (with optional dependents inline)
 * - Creating DEPENDENT members (standalone)
 * - Updating both principal and dependent members
 * - Family eligibility checks (barcode scan → family view)
 * - Card number generation (unified with suffix)
 * - Barcode generation (principal only)
 * 
 * Business Rules:
 * - Principal: parent_id = NULL, barcode = REQUIRED
 * - Dependent: parent_id != NULL, barcode = NULL
 * - Card Number: Principal = base, Dependent = base + suffix
 * - Relationship: NULL for principal, REQUIRED for dependent
 * 
 * SECURITY (2026-01-16):
 * - EMPLOYER_ADMIN: Sees ONLY members from their own employer
 * - Feature toggle: canViewMembers controls access
 * =====================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedMemberService {

    private final MemberRepository memberRepository;
    private final OrganizationRepository organizationRepository;
    private final BenefitPolicyRepository benefitPolicyRepository;
    private final BarcodeGeneratorService barcodeGenerator;
    private final CardNumberGeneratorService cardNumberGenerator;
    private final UnifiedMemberMapper mapper;
    private final AuthorizationService authorizationService;

    /**
     * Create a PRINCIPAL member (optionally with dependents inline).
     * 
     * @param dto Member creation DTO
     * @return Created member view DTO with dependents
     */
    @Transactional
    public MemberViewDto createPrincipalMember(MemberCreateDto dto) {
        log.info("🆕 Creating PRINCIPAL member: {}", dto.getFullName());
        
        // Validate: Must NOT have parentId (principal)
        if (dto.getParentId() != null) {
            throw new BusinessRuleException(
                "Cannot create principal member with parentId. " +
                "Use createDependentMember() for dependents."
            );
        }
        
        // 1. Generate BARCODE (MANDATORY for principal)
        String barcode = barcodeGenerator.generateUniqueBarcodeForPrincipal();
        log.info("✅ Generated barcode for principal: {}", barcode);
        
        // 2. Generate CARD NUMBER (base number)
        String cardNumber = dto.getCardNumber();
        if (cardNumber == null || cardNumber.trim().isEmpty()) {
            cardNumber = cardNumberGenerator.generateUniqueForPrincipal();
            log.info("✅ Generated card number for principal: {}", cardNumber);
        } else {
            // Validate user-provided card number
            if (!cardNumberGenerator.isValidCardNumberFormat(cardNumber)) {
                throw new BusinessRuleException(
                    "Invalid card number format. Must be 6 digits (e.g., 000123)"
                );
            }
            if (memberRepository.existsByCardNumber(cardNumber)) {
                throw new BusinessRuleException(
                    "Card number already exists: " + cardNumber
                );
            }
        }
        
        // 3. Load organization relationships
        Organization employerOrg = organizationRepository.findById(dto.getEmployerId())
            .orElseThrow(() -> new ResourceNotFoundException("Employer organization not found: " + dto.getEmployerId()));
        
        log.info("✅ Loaded employer organization: id={}, name={}", employerOrg.getId(), employerOrg.getName());
        
        BenefitPolicy benefitPolicy = null;
        if (dto.getBenefitPolicyId() != null) {
            benefitPolicy = benefitPolicyRepository.findById(dto.getBenefitPolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("Benefit policy not found: " + dto.getBenefitPolicyId()));
            log.info("✅ Loaded benefit policy: id={}, name={}", benefitPolicy.getId(), benefitPolicy.getName());
        } else {
            log.warn("⚠️ No benefit policy specified for new member");
        }
        
        // 4. Create PRINCIPAL member entity
        Member principal = mapper.toEntity(dto);
        principal.setBarcode(barcode);
        principal.setCardNumber(cardNumber);
        principal.setEmployerOrganization(employerOrg);
        principal.setBenefitPolicy(benefitPolicy);
        principal.setParent(null); // PRINCIPAL
        principal.setRelationship(null); // PRINCIPAL has no relationship
        
        // 5. Save principal
        principal = memberRepository.save(principal);
        log.info("✅ Created PRINCIPAL member ID={}, barcode={}, cardNumber={}, employer={}", 
                 principal.getId(), principal.getBarcode(), principal.getCardNumber(),
                 principal.getEmployerOrganization() != null ? principal.getEmployerOrganization().getName() : "NONE");
        
        // 6. Create DEPENDENTS if provided
        List<Member> dependents = new ArrayList<>();
        if (dto.getDependents() != null && !dto.getDependents().isEmpty()) {
            log.info("📦 Creating {} dependents for principal ID={}", 
                     dto.getDependents().size(), principal.getId());
            
            for (DependentMemberDto depDto : dto.getDependents()) {
                Member dependent = createDependentInternal(principal, depDto);
                dependents.add(dependent);
            }
        }
        
        // Note: familyMembers field removed as part of unified architecture
        
        // 7. Return view DTO
        return mapper.toViewDto(principal, dependents);
    }

    /**
     * Create a DEPENDENT member under an existing principal (NEW METHOD).
     * 
     * @param principalId ID of the principal member
     * @param dto Dependent member creation DTO
     * @return Created dependent view DTO
     */
    @Transactional
    public MemberViewDto createDependentMember(Long principalId, DependentMemberDto dto) {
        log.info("🆕 Creating DEPENDENT member under principal ID={}: {}", principalId, dto.getFullName());
        
        // 1. Load principal member
        Member principal = memberRepository.findById(principalId)
            .orElseThrow(() -> new ResourceNotFoundException("Principal member not found: " + principalId));
        
        // Validate principal is not a dependent
        if (principal.isDependent()) {
            throw new BusinessRuleException(
                "Cannot create dependent under another dependent. " +
                "Dependents can only be created under principal members."
            );
        }
        
        // 2. Create dependent (using internal method)
        Member dependent = createDependentInternal(principal, dto);
        
        // 3. Return view DTO
        return mapper.toViewDto(dependent);
    }

    /**
     * Create a DEPENDENT member (standalone, under existing principal) - LEGACY METHOD.
     * 
     * @param dto Member creation DTO (must have parentId and relationship)
     * @return Created dependent view DTO
     * @deprecated Use createDependentMember(Long, DependentMemberDto) instead
     */
    @Deprecated
    @Transactional
    public MemberViewDto createDependentMember(MemberCreateDto dto) {
        log.info("🆕 Creating DEPENDENT member: {}", dto.getFullName());
        
        // Validate: Must have parentId (dependent)
        if (dto.getParentId() == null) {
            throw new BusinessRuleException(
                "Cannot create dependent member without parentId. " +
                "Use createPrincipalMember() for principals."
            );
        }
        
        // Validate: Must have relationship
        if (dto.getRelationship() == null) {
            throw new BusinessRuleException(
                "Relationship is required for dependent members"
            );
        }
        
        // 1. Load principal member
        Member principal = memberRepository.findById(dto.getParentId())
            .orElseThrow(() -> new ResourceNotFoundException("Principal member not found: " + dto.getParentId()));
        
        // Validate principal is not a dependent
        if (principal.isDependent()) {
            throw new BusinessRuleException(
                "Cannot create dependent under another dependent. " +
                "Dependents can only be created under principal members."
            );
        }
        
        // 2. Create dependent (using internal method)
        DependentMemberDto depDto = DependentMemberDto.builder()
            .relationship(dto.getRelationship())
            .fullName(dto.getFullName())
            .nationalNumber(dto.getNationalNumber())
            .birthDate(dto.getBirthDate())
            .gender(dto.getGender())
            .maritalStatus(dto.getMaritalStatus())
            .phone(dto.getPhone())
            .email(dto.getEmail())
            .occupation(dto.getOccupation())
            .notes(dto.getNotes())
            .active(dto.getActive())
            .build();
        
        Member dependent = createDependentInternal(principal, depDto);
        
        // 3. Return view DTO
        return mapper.toViewDto(dependent);
    }

    /**
     * Internal method to create a dependent member.
     * 
     * @param principal Principal member (parent)
     * @param dto Dependent member DTO
     * @return Created dependent entity
     */
    @Transactional
    protected Member createDependentInternal(Member principal, DependentMemberDto dto) {
        log.debug("Creating dependent: {} ({})", dto.getFullName(), dto.getRelationship());
        
        // 1. Generate card number with suffix
        String cardNumber = cardNumberGenerator.generateForDependent(principal);
        log.debug("✅ Generated card number for dependent: {}", cardNumber);
        
        // 2. Create dependent entity
        Member dependent = mapper.toEntity(dto);
        dependent.setParent(principal);
        dependent.setCardNumber(cardNumber);
        dependent.setBarcode(null); // NO barcode for dependents
        
        // 3. Inherit from principal
        dependent.setEmployerOrganization(principal.getEmployerOrganization());
        dependent.setBenefitPolicy(principal.getBenefitPolicy());
        dependent.setPolicyNumber(principal.getPolicyNumber());
        
        // 4. Save
        dependent = memberRepository.save(dependent);
        log.info("✅ Created DEPENDENT member ID={}, cardNumber={}, relationship={}", 
                 dependent.getId(), dependent.getCardNumber(), dependent.getRelationship());
        
        return dependent;
    }

    /**
     * Update a member (principal or dependent).
     * 
     * @param id Member ID
     * @param dto Update DTO
     * @return Updated member view DTO
     */
    @Transactional
    public MemberViewDto updateMember(Long id, MemberUpdateDto dto) {
        log.info("📝 Updating member ID={}", id);
        
        Member member = memberRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));
        
        // Update common fields
        mapper.updateEntityFromDto(member, dto);
        
        // Save
        member = memberRepository.save(member);
        log.info("✅ Updated member ID={}", id);
        
        // Return view based on type
        if (member.isPrincipal()) {
            List<Member> dependents = memberRepository.findByParentId(member.getId());
            return mapper.toViewDto(member, dependents);
        } else {
            return mapper.toViewDto(member);
        }
    }

    /**
     * Get member by ID (with dependents if principal).
     * 
     * @param id Member ID
     * @return Member view DTO
     */
    @Transactional(readOnly = true)
    public MemberViewDto getMember(Long id) {
        Member member = memberRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));
        
        if (member.isPrincipal()) {
            List<Member> dependents = memberRepository.findByParentId(member.getId());
            return mapper.toViewDto(member, dependents);
        } else {
            return mapper.toViewDto(member);
        }
    }

    /**
     * Check family eligibility by barcode (principal's barcode).
     * 
     * Returns principal + all dependents for selection.
     * 
     * @param barcode Principal member's barcode
     * @return Family eligibility response
     */
    @Transactional(readOnly = true)
    public FamilyEligibilityResponseDto checkFamilyEligibility(String barcode) {
        log.info("🔍 Checking family eligibility for barcode: {}", barcode);
        
        // 1. Find principal by barcode
        Member principal = memberRepository.findByBarcode(barcode)
            .orElseThrow(() -> new ResourceNotFoundException("No member found with barcode: " + barcode));
        
        // Validate it's a principal (should always be true if barcode exists)
        if (principal.isDependent()) {
            throw new BusinessRuleException(
                "Invalid state: Dependent member has barcode. Only principals should have barcodes."
            );
        }
        
        // 🔍 Debug logging for employer organization
        log.info("📋 Member details: id={}, fullName={}, active={}, eligibilityStatus={}", 
                 principal.getId(), principal.getFullName(), principal.getActive(), principal.getEligibilityStatus());
        
        if (principal.getEmployerOrganization() != null) {
            log.info("✅ Employer Organization: id={}, name={}", 
                     principal.getEmployerOrganization().getId(), 
                     principal.getEmployerOrganization().getName());
        } else {
            log.warn("⚠️ Member ID={} has NO Employer Organization! This will cause eligibility failure.", 
                     principal.getId());
        }
        
        if (principal.getBenefitPolicy() != null) {
            log.info("✅ Benefit Policy: id={}, name={}, status={}", 
                     principal.getBenefitPolicy().getId(), 
                     principal.getBenefitPolicy().getName(),
                     principal.getBenefitPolicy().getStatus());
        } else {
            log.warn("⚠️ Member ID={} has NO Benefit Policy assigned.", principal.getId());
        }
        
        // 2. Load all dependents
        List<Member> dependents = memberRepository.findByParentId(principal.getId());
        
        // 3. Build response
        FamilyEligibilityResponseDto response = mapper.toFamilyEligibilityResponse(principal, dependents);
        
        log.info("✅ Family eligibility check complete: eligible={}, {} total members ({} principal + {} dependents), employer={}", 
                 response.getEligible(), response.getTotalFamilyMembers(), 1, dependents.size(),
                 response.getEmployerOrgName() != null ? response.getEmployerOrgName() : "NONE");
        
        return response;
    }

    /**
     * Delete member (principal or dependent).
     * 
     * IMPORTANT: Deleting a principal will CASCADE delete all dependents.
     * 
     * @param id Member ID
     */
    @Transactional
    public void deleteMember(Long id) {
        Member member = memberRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));
        
        if (member.isPrincipal()) {
            long dependentsCount = memberRepository.countByParentId(id);
            log.warn("⚠️ Deleting PRINCIPAL member ID={} will CASCADE delete {} dependents", 
                     id, dependentsCount);
        }
        
        memberRepository.delete(member);
        log.info("✅ Deleted member ID={}", id);
    }

    // ==================== ADDITIONAL METHODS FOR UNIFIED CONTROLLER ====================

    /**
     * Create member (principal with optional inline dependents).
     * Alias for createPrincipalMember for controller compatibility.
     */
    @Transactional
    public MemberViewDto createMember(MemberCreateDto dto) {
        return createPrincipalMember(dto);
    }

    /**
     * Add dependent to existing principal.
     */
    @Transactional
    public MemberViewDto addDependent(Long principalId, DependentMemberDto dto) {
        return createDependentMember(principalId, dto);
    }

    /**
     * Get member with dependents (if principal).
     * Alias for getMember for controller compatibility.
     */
    @Transactional(readOnly = true)
    public MemberViewDto getMemberWithDependents(Long id) {
        return getMember(id);
    }

    /**
     * Check eligibility by barcode.
     * Alias for checkFamilyEligibility for controller compatibility.
     */
    @Transactional(readOnly = true)
    public FamilyEligibilityResponseDto checkEligibility(String barcode) {
        return checkFamilyEligibility(barcode);
    }

    /**
     * Get all members with pagination and optional filters.
     * 
     * @param pageable Pagination info
     * @param organizationId Optional organization filter
     * @param status Optional status filter
     * @param type Optional member type filter (PRINCIPAL/DEPENDENT)
     * @return Page of members
     * 
     * SECURITY (2026-01-16):
     * - EMPLOYER_ADMIN: Automatically filtered to their employer only
     * - SUPER_ADMIN/INSURANCE_ADMIN: No automatic filter (can see all)
     */
    @Transactional(readOnly = true)
    public Page<MemberViewDto> getAllMembers(
            Pageable pageable, 
            Long organizationId, 
            String status, 
            String type) {
        
        log.info("Fetching all members: page={}, size={}, org={}, status={}, type={}", 
                 pageable.getPageNumber(), pageable.getPageSize(), organizationId, status, type);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // EMPLOYER_ADMIN SECURITY FILTER (2026-01-16)
        // ═══════════════════════════════════════════════════════════════════════════
        User currentUser = authorizationService.getCurrentUser();
        Long effectiveOrgId = organizationId;
        
        if (currentUser != null && authorizationService.isEmployerAdmin(currentUser)) {
            // Check feature toggle
            if (!authorizationService.canEmployerViewMembers(currentUser)) {
                log.warn("❌ EMPLOYER_ADMIN user {} attempted to view members but feature VIEW_MEMBERS is disabled", 
                    currentUser.getUsername());
                return Page.empty();
            }
            
            // EMPLOYER_ADMIN is LOCKED to their employer - override any provided filter
            Long employerFilter = authorizationService.getEmployerFilterForUser(currentUser);
            if (employerFilter == null) {
                log.warn("⚠️ EMPLOYER_ADMIN user {} has no employerId assigned", currentUser.getUsername());
                return Page.empty();
            }
            
            effectiveOrgId = employerFilter;
            log.info("🔒 EMPLOYER_ADMIN filter applied: user={}, locked to employerId={}", 
                currentUser.getUsername(), effectiveOrgId);
        }
        
        final Long finalOrgId = effectiveOrgId;
        
        Specification<Member> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (finalOrgId != null) {
                predicates.add(cb.equal(root.get("employerOrganization").get("id"), finalOrgId));
            }
            
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            
            if (type != null && !type.trim().isEmpty()) {
                if ("PRINCIPAL".equalsIgnoreCase(type)) {
                    predicates.add(cb.isNull(root.get("parent")));
                } else if ("DEPENDENT".equalsIgnoreCase(type)) {
                    predicates.add(cb.isNotNull(root.get("parent")));
                }
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<Member> membersPage = memberRepository.findAll(spec, pageable);
        
        List<MemberViewDto> dtoList = membersPage.getContent().stream()
            .map(member -> {
                if (member.isPrincipal()) {
                    List<Member> dependents = memberRepository.findByParentId(member.getId());
                    return mapper.toViewDto(member, dependents);
                } else {
                    return mapper.toViewDto(member);
                }
            })
            .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, membersPage.getTotalElements());
    }

    /**
     * Count members with optional filters.
     * Matches the logic of getAllMembers (Phase 2 Requirement)
     * 
     * @param organizationId Optional organization filter
     * @param status Optional status filter
     * @param type Optional member type filter (PRINCIPAL/DEPENDENT)
     * @return Count of matching members
     */
    @Transactional(readOnly = true)
    public long countMembers(Long organizationId, String status, String type) {
        
        // ═══════════════════════════════════════════════════════════════════════════
        // EMPLOYER_ADMIN SECURITY FILTER (COPIED from getAllMembers)
        // ═══════════════════════════════════════════════════════════════════════════
        User currentUser = authorizationService.getCurrentUser();
        Long effectiveOrgId = organizationId;
        
        if (currentUser != null && authorizationService.isEmployerAdmin(currentUser)) {
            // Check feature toggle
            if (!authorizationService.canEmployerViewMembers(currentUser)) {
                return 0;
            }
            
            // EMPLOYER_ADMIN is LOCKED to their employer - override any provided filter
            Long employerFilter = authorizationService.getEmployerFilterForUser(currentUser);
            if (employerFilter == null) {
                return 0;
            }
            
            effectiveOrgId = employerFilter;
        }
        
        final Long finalOrgId = effectiveOrgId;
        
        Specification<Member> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (finalOrgId != null) {
                predicates.add(cb.equal(root.get("employerOrganization").get("id"), finalOrgId));
            }
            
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            
            if (type != null && !type.trim().isEmpty()) {
                if ("PRINCIPAL".equalsIgnoreCase(type)) {
                    predicates.add(cb.isNull(root.get("parent")));
                } else if ("DEPENDENT".equalsIgnoreCase(type)) {
                    predicates.add(cb.isNotNull(root.get("parent")));
                }
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        return memberRepository.count(spec);
    }

    /**
     * Advanced search for members.
     * 
     * @param nameAr Arabic name filter
     * @param nameEn English name filter
     * @param civilId Civil ID filter
     * @param barcode Barcode filter
     * @param cardNumber Card number filter
     * @param organizationId Organization filter
     * @param benefitPolicyId Benefit policy filter
     * @param status Status filter
     * @param type Member type filter
     * @param pageable Pagination info
     * @return Page of search results
     * 
     * SECURITY (2026-01-16):
     * - EMPLOYER_ADMIN: Automatically filtered to their employer only
     * - SUPER_ADMIN/INSURANCE_ADMIN: No automatic filter (can see all)
     */
    @Transactional(readOnly = true)
    public Page<MemberViewDto> searchMembers(
            String nameAr, 
            String nameEn, 
            String civilId, 
            String barcode,
            String cardNumber,
            Long organizationId,
            Long benefitPolicyId,
            String status,
            String type,
            Pageable pageable) {
        
        log.info("Searching members: nameAr={}, civilId={}, barcode={}, cardNumber={}", 
                 nameAr, civilId, barcode, cardNumber);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // EMPLOYER_ADMIN SECURITY FILTER (2026-01-16)
        // ═══════════════════════════════════════════════════════════════════════════
        User currentUser = authorizationService.getCurrentUser();
        Long effectiveOrgId = organizationId;
        
        if (currentUser != null && authorizationService.isEmployerAdmin(currentUser)) {
            // Check feature toggle
            if (!authorizationService.canEmployerViewMembers(currentUser)) {
                log.warn("❌ EMPLOYER_ADMIN user {} attempted to search members but feature VIEW_MEMBERS is disabled", 
                    currentUser.getUsername());
                return Page.empty();
            }
            
            // EMPLOYER_ADMIN is LOCKED to their employer - override any provided filter
            Long employerFilter = authorizationService.getEmployerFilterForUser(currentUser);
            if (employerFilter == null) {
                log.warn("⚠️ EMPLOYER_ADMIN user {} has no employerId assigned", currentUser.getUsername());
                return Page.empty();
            }
            
            effectiveOrgId = employerFilter;
            log.info("🔒 EMPLOYER_ADMIN search filter applied: user={}, locked to employerId={}", 
                currentUser.getUsername(), effectiveOrgId);
        }
        
        final Long finalOrgId = effectiveOrgId;
        
        Specification<Member> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (nameAr != null && !nameAr.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("nameAr")), "%" + nameAr.toLowerCase() + "%"));
            }
            
            if (nameEn != null && !nameEn.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("nameEn")), "%" + nameEn.toLowerCase() + "%"));
            }
            
            if (civilId != null && !civilId.trim().isEmpty()) {
                predicates.add(cb.like(root.get("civilId"), "%" + civilId + "%"));
            }
            
            if (barcode != null && !barcode.trim().isEmpty()) {
                predicates.add(cb.like(root.get("barcode"), "%" + barcode + "%"));
            }
            
            if (cardNumber != null && !cardNumber.trim().isEmpty()) {
                predicates.add(cb.like(root.get("cardNumber"), "%" + cardNumber + "%"));
            }
            
            if (finalOrgId != null) {
                predicates.add(cb.equal(root.get("employerOrganization").get("id"), finalOrgId));
            }
            
            if (benefitPolicyId != null) {
                predicates.add(cb.equal(root.get("benefitPolicy").get("id"), benefitPolicyId));
            }
            
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            
            if (type != null && !type.trim().isEmpty()) {
                if ("PRINCIPAL".equalsIgnoreCase(type)) {
                    predicates.add(cb.isNull(root.get("parent")));
                } else if ("DEPENDENT".equalsIgnoreCase(type)) {
                    predicates.add(cb.isNotNull(root.get("parent")));
                }
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<Member> membersPage = memberRepository.findAll(spec, pageable);
        
        List<MemberViewDto> dtoList = membersPage.getContent().stream()
            .map(member -> {
                if (member.isPrincipal()) {
                    List<Member> dependents = memberRepository.findByParentId(member.getId());
                    return mapper.toViewDto(member, dependents);
                } else {
                    return mapper.toViewDto(member);
                }
            })
            .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, membersPage.getTotalElements());
    }

    /**
     * Get all dependents of a principal.
     * 
     * @param principalId Principal member ID
     * @return List of dependents
     */
    @Transactional(readOnly = true)
    public List<MemberViewDto> getDependents(Long principalId) {
        Member principal = memberRepository.findById(principalId)
            .orElseThrow(() -> new ResourceNotFoundException("Principal member not found: " + principalId));
        
        if (principal.isDependent()) {
            throw new BusinessRuleException("Member ID " + principalId + " is a Dependent, not a Principal");
        }
        
        List<Member> dependents = memberRepository.findByParentId(principalId);
        
        return dependents.stream()
            .map(mapper::toViewDto)
            .collect(Collectors.toList());
    }

    /**
     * Count dependents of a principal.
     * 
     * @param principalId Principal member ID
     * @return Count of dependents
     */
    @Transactional(readOnly = true)
    public long countDependents(Long principalId) {
        Member principal = memberRepository.findById(principalId)
            .orElseThrow(() -> new ResourceNotFoundException("Principal member not found: " + principalId));
        
        if (principal.isDependent()) {
            throw new BusinessRuleException("Member ID " + principalId + " is a Dependent, not a Principal");
        }
        
        return memberRepository.countByParentId(principalId);
    }
}
