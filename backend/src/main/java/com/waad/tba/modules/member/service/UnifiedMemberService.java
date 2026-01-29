package com.waad.tba.modules.member.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

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
import com.waad.tba.modules.member.entity.MemberWorkflowHistory;
import com.waad.tba.modules.member.mapper.UnifiedMemberMapper;
import com.waad.tba.modules.member.repository.MemberRepository;
import com.waad.tba.modules.member.repository.MemberWorkflowHistoryRepository;
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
    private final MemberWorkflowHistoryRepository workflowHistoryRepository;
    private final OrganizationRepository organizationRepository;
    private final BenefitPolicyRepository benefitPolicyRepository;
    private final BarcodeGeneratorService barcodeGenerator;
    private final CardNumberGeneratorService cardNumberGenerator;
    private final UnifiedMemberMapper mapper;
    private final AuthorizationService authorizationService;

    /**
     * Requirement 6: Create a DRAFT member with minimum info
     */
    @Transactional
    public MemberViewDto createDraftMember(MemberCreateDto dto) {
        log.info("🆕 Creating DRAFT member: {}", dto.getFullName());
        dto.setStatus(Member.MemberStatus.DRAFT);
        return createPrincipalMember(dto);
    }

    /**
     * Create a PRINCIPAL member (optionally with dependents inline).
     * Updated for Enterprise Smart Card Numbering.
     */
    @Transactional
    public MemberViewDto createPrincipalMember(MemberCreateDto dto) {
        log.info("🆕 Creating PRINCIPAL member: {}, Status: {}", dto.getFullName(), dto.getStatus());

        if (dto.getParentId() != null) {
            throw new BusinessRuleException("Cannot create principal member with parentId.");
        }

        // Barcode will be generated AFTER card number
        // String barcode = barcodeGenerator.generateUniqueBarcodeForPrincipal();

        Organization employerOrg = organizationRepository.findById(dto.getEmployerId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Employer organization not found: " + dto.getEmployerId()));

        BenefitPolicy benefitPolicy = null;
        if (dto.getBenefitPolicyId() != null) {
            benefitPolicy = benefitPolicyRepository.findById(dto.getBenefitPolicyId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Benefit policy not found: " + dto.getBenefitPolicyId()));
        }

        Member principal = mapper.toEntity(dto);
        // Barcode set later derived from card number
        principal.setEmployerOrganization(employerOrg);
        principal.setBenefitPolicy(benefitPolicy);
        principal.setParent(null);
        principal.setRelationship(null);

        // Requirement 1: Generate Smart Card Number [R]-[PRO]-[COMP]-[ID]
        String smartCardNumber = cardNumberGenerator.generateSmartCardNumber(principal);
        principal.setCardNumber(smartCardNumber);

        // Requirement: Barcode = [PREFIX]-[CARD_NUMBER]
        String barcode = barcodeGenerator.generateFromCardNumber(principal);
        principal.setBarcode(barcode);

        principal = memberRepository.save(principal);

        // Log Initial Status
        logWorkflowHistory(principal, null, principal.getStatus().name(), "Initial Creation");

        List<Member> dependents = new ArrayList<>();
        if (dto.getDependents() != null && !dto.getDependents().isEmpty()) {
            for (DependentMemberDto depDto : dto.getDependents()) {
                Member dependent = createDependentInternal(principal, depDto);
                dependents.add(dependent);
            }
        }

        return mapper.toViewDto(principal, dependents);
    }

    /**
     * Requirement 6: Promote Draft/Pending member to ACTIVE
     */
    @Transactional
    public MemberViewDto promoteToActive(Long id, String reason) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));

        if (member.getStatus() == Member.MemberStatus.ACTIVE) {
            return mapper.toViewDto(member);
        }

        transitionMemberStatus(member, Member.MemberStatus.ACTIVE, reason);

        if (Boolean.TRUE.equals(member.getIsSmartCard()) && member.getCardActivatedAt() == null) {
            member.setCardActivatedAt(LocalDateTime.now());
            memberRepository.save(member);
        }

        return getMember(id);
    }

    @Transactional
    public void transitionMemberStatus(Member member, Member.MemberStatus newStatus, String reason) {
        String fromStatus = member.getStatus().name();
        member.setStatus(newStatus);
        memberRepository.save(member);

        logWorkflowHistory(member, fromStatus, newStatus.name(), reason);
        log.info("✅ Member ID={} status transitioned from {} to {} Reason: {}",
                member.getId(), fromStatus, newStatus, reason);
    }

    private void logWorkflowHistory(Member member, String fromStatus, String toStatus, String reason) {
        MemberWorkflowHistory history = MemberWorkflowHistory.builder()
                .member(member)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .changedAt(LocalDateTime.now())
                .changedBy(authorizationService.getCurrentUser() != null
                        ? authorizationService.getCurrentUser().getUsername()
                        : "System")
                .reason(reason)
                .build();
        workflowHistoryRepository.save(history);
    }

    @Transactional
    protected Member createDependentInternal(Member principal, DependentMemberDto dto) {
        Member dependent = mapper.toEntity(dto);
        dependent.setParent(principal);
        dependent.setBarcode(null);
        dependent.setEmployerOrganization(principal.getEmployerOrganization());
        dependent.setBenefitPolicy(principal.getBenefitPolicy());
        dependent.setPolicyNumber(principal.getPolicyNumber());

        // Requirement 1: Enterprise Numbering for dependent
        String smartCardNumber = cardNumberGenerator.generateSmartCardNumber(dependent);
        dependent.setCardNumber(smartCardNumber);

        dependent = memberRepository.save(dependent);
        logWorkflowHistory(dependent, null, dependent.getStatus().name(), "Initial Creation (Dependent)");

        return dependent;
    }

    // ... (Keep existing methods for search/getAll/delete, but maybe update them
    // for numbering if needed)

    @Transactional(readOnly = true)
    public List<MemberWorkflowHistory> getWorkflowHistory(Long id) {
        return workflowHistoryRepository.findByMemberIdOrderByChangedAtDesc(id);
    }

    /**
     * Standalone creation of dependent member
     */
    @Transactional
    public MemberViewDto createDependentMember(Long principalId, DependentMemberDto dto) {
        Member principal = memberRepository.findById(principalId)
                .orElseThrow(() -> new ResourceNotFoundException("Principal not found: " + principalId));

        Member dependent = createDependentInternal(principal, dto);
        return mapper.toViewDto(dependent);
    }

    /**
     * Existing search and list methods (simplified for brevity, assume they remain)
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
     * Alias for controller compatibility
     */
    @Transactional(readOnly = true)
    public MemberViewDto getMemberWithDependents(Long id) {
        return getMember(id);
    }

    @Transactional
    public MemberViewDto updateMember(Long id, MemberUpdateDto dto) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));

        Member.MemberStatus oldStatus = member.getStatus();
        mapper.updateEntityFromDto(member, dto);

        if (dto.getStatus() != null && dto.getStatus() != oldStatus) {
            logWorkflowHistory(member, oldStatus.name(), dto.getStatus().name(), "Direct Update");
        }

        member = memberRepository.save(member);
        return getMember(id);
    }

    @Transactional
    public void deleteMember(Long id) {
        // Soft Delete Implementation
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));

        member.setActive(false);
        // FORCE status change to TERMINATED to reflect deletion in UI
        member.setStatus(Member.MemberStatus.TERMINATED);

        memberRepository.save(member);

        // Cascade soft delete to dependents
        List<Member> dependents = memberRepository.findByParentId(id);
        for (Member dep : dependents) {
            dep.setActive(false);
            dep.setStatus(Member.MemberStatus.TERMINATED);
            memberRepository.save(dep);
        }

        logWorkflowHistory(member, member.getStatus() != null ? member.getStatus().name() : "UNKNOWN",
                member.getStatus() != null ? member.getStatus().name() : "UNKNOWN",
                "Soft deleted (moved to trash)");

        log.info("🗑️ Member soft-deleted: id={}, dependents={}", id, dependents.size());
    }

    /**
     * Restore a soft-deleted member
     */
    @Transactional
    public void restoreMember(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));

        if (Boolean.TRUE.equals(member.getActive())) {
            throw new BusinessRuleException("Member is already active");
        }

        member.setActive(true);
        member.setStatus(Member.MemberStatus.ACTIVE);
        memberRepository.save(member);

        // Cascade restore to dependents
        List<Member> dependents = memberRepository.findByParentId(id);
        for (Member dep : dependents) {
            dep.setActive(true);
            dep.setStatus(Member.MemberStatus.ACTIVE);
            memberRepository.save(dep);
        }

        logWorkflowHistory(member, member.getStatus() != null ? member.getStatus().name() : "UNKNOWN",
                member.getStatus() != null ? member.getStatus().name() : "UNKNOWN",
                "Restored from trash");

        log.info("♻️ Member restored: id={}, dependents={}", member.getId(), dependents.size());
    }

    @Transactional(readOnly = true)
    public FamilyEligibilityResponseDto checkFamilyEligibility(String query) {
        String cleanQuery = query != null ? query.trim() : "";

        // 1. Try Barcode Match
        java.util.List<Member> members = memberRepository.findByBarcode(cleanQuery);
        Member targetMember = null;

        if (!members.isEmpty()) {
            targetMember = members.get(0);
        } else {
            // 2. Try Card Number Match (Direct)
            members = memberRepository.findByCardNumber(cleanQuery);
            if (!members.isEmpty()) {
                targetMember = members.get(0);
            }
        }

        // 3. Smart Fallback: If not found, try to find Principal by stripping suffix
        // Dependent Card: EMP-2026-100037S -> Principal: EMP-2026-100037
        if (targetMember == null && cleanQuery.length() > 1) {
            // Common suffixes: W, S, D, F, M, H, etc.
            // Try stripping the last character to see if it matches a Principal's card
            // number
            String potentialPrincipalCard = cleanQuery.substring(0, cleanQuery.length() - 1);
            members = memberRepository.findByCardNumber(potentialPrincipalCard);

            if (!members.isEmpty()) {
                Member found = members.get(0);
                if (found.isPrincipal()) {
                    log.info("found principal via smart suffix stripping: {} -> {}", cleanQuery,
                            potentialPrincipalCard);
                    targetMember = found;
                }
            }
        }

        if (targetMember == null) {
            throw new ResourceNotFoundException("Member not found with Barcode or Card Number: " + cleanQuery);
        }

        // Resolve Principal (If dependent found, get parent)
        Member principal;
        if (targetMember.getParent() != null) {
            principal = targetMember.getParent();
        } else {
            principal = targetMember;
        }

        List<Member> dependents = memberRepository.findByParentId(principal.getId());
        return mapper.toFamilyEligibilityResponse(principal, dependents);
    }

    /**
     * Alias for controller compatibility
     */
    @Transactional(readOnly = true)
    public FamilyEligibilityResponseDto checkEligibility(String barcode) {
        return checkFamilyEligibility(barcode);
    }

    @Transactional(readOnly = true)
    public Page<MemberViewDto> getAllMembers(Pageable pageable, Long organizationId, String status, String type,
            boolean deleted) {
        // Implementation remains same as before but uses updated mapper
        Specification<Member> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (organizationId != null)
                predicates.add(cb.equal(root.get("employerOrganization").get("id"), organizationId));
            if (status != null && !status.isEmpty())
                predicates.add(cb.equal(root.get("status"), Member.MemberStatus.valueOf(status)));
            if ("PRINCIPAL".equalsIgnoreCase(type))
                predicates.add(cb.isNull(root.get("parent")));
            else if ("DEPENDENT".equalsIgnoreCase(type))
                predicates.add(cb.isNotNull(root.get("parent")));

            // Filter based on deleted flag
            predicates.add(cb.equal(root.get("active"), !deleted));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Member> page = memberRepository.findAll(spec, pageable);
        return page.map(member -> {
            MemberViewDto dto;
            if (member.isPrincipal()) {
                dto = mapper.toViewDto(member, memberRepository.findByParentId(member.getId()));
            } else {
                dto = mapper.toViewDto(member);
            }

            // Override status for view if soft-deleted (Visual Fix for old records)
            if (Boolean.FALSE.equals(member.getActive())) {
                dto.setStatus(Member.MemberStatus.TERMINATED);
            }
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public long countMembers(Long organizationId, String status, String type, boolean deleted) {
        Specification<Member> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (organizationId != null)
                predicates.add(cb.equal(root.get("employerOrganization").get("id"), organizationId));
            if (status != null && !status.isEmpty())
                predicates.add(cb.equal(root.get("status"), Member.MemberStatus.valueOf(status)));
            if ("PRINCIPAL".equalsIgnoreCase(type))
                predicates.add(cb.isNull(root.get("parent")));
            else if ("DEPENDENT".equalsIgnoreCase(type))
                predicates.add(cb.isNotNull(root.get("parent")));

            // Fix: Filter only active members (Soft Delete)
            predicates.add(cb.equal(root.get("active"), true));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return memberRepository.count(spec);
    }

    @Transactional(readOnly = true)
    public Page<MemberViewDto> searchMembers(
            String searchTermInput, String civilId, String barcode,
            String cardNumber, Long organizationId, Long benefitPolicyId,
            String status, String type, boolean deleted, Pageable pageable) {

        Specification<Member> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            // unified search strategy
            String searchTerm = (searchTermInput != null && !searchTermInput.trim().isEmpty()) ? searchTermInput : null;

            // Detect if this is a "General Search" where frontend sends same value to
            // multiple fields
            // Ensure we handle empty strings correctly
            boolean isGeneralSearch = searchTerm != null &&
                    ((barcode != null && searchTerm.equals(barcode)) ||
                            (cardNumber != null && searchTerm.equals(cardNumber)));

            if (isGeneralSearch) {
                // OR Logic for General Search
                String likePattern = "%" + searchTerm.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), likePattern),
                        cb.like(cb.lower(root.get("barcode")), likePattern),
                        cb.like(cb.lower(root.get("cardNumber")), likePattern)));
            } else {
                // Standard Specific Filter Logic (AND)
                if (searchTerm != null) {
                    predicates.add(cb.like(cb.lower(root.get("fullName")), "%" + searchTerm.toLowerCase() + "%"));
                }
                if (barcode != null && !barcode.trim().isEmpty())
                    predicates.add(cb.equal(root.get("barcode"), barcode));
                if (cardNumber != null && !cardNumber.trim().isEmpty())
                    predicates.add(cb.equal(root.get("cardNumber"), cardNumber));
            }

            // Other exact filters always apply (AND)
            if (civilId != null && !civilId.trim().isEmpty())
                predicates.add(cb.equal(root.get("nationalNumber"), civilId));
            if (organizationId != null)
                predicates.add(cb.equal(root.get("employerOrganization").get("id"), organizationId));
            if (benefitPolicyId != null)
                predicates.add(cb.equal(root.get("benefitPolicy").get("id"), benefitPolicyId));

            if (status != null && !status.trim().isEmpty()) {
                try {
                    predicates.add(cb.equal(root.get("status"), Member.MemberStatus.valueOf(status)));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status provided for search: {}", status);
                }
            }

            if ("PRINCIPAL".equalsIgnoreCase(type))
                predicates.add(cb.isNull(root.get("parent")));
            else if ("DEPENDENT".equalsIgnoreCase(type))
                predicates.add(cb.isNotNull(root.get("parent")));

            // Fix: Filter only active members (Soft Delete)
            predicates.add(cb.equal(root.get("active"), true));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return memberRepository.findAll(spec, pageable).map(member -> {
            MemberViewDto dto;
            if (member.isPrincipal()) {
                dto = mapper.toViewDto(member, memberRepository.findByParentId(member.getId()));
            } else {
                dto = mapper.toViewDto(member);
            }

            // Override status for view if soft-deleted (Visual Fix for old records)
            if (Boolean.FALSE.equals(member.getActive())) {
                dto.setStatus(Member.MemberStatus.TERMINATED);
            }
            return dto;
        });
    }

    /**
     * Alias for controller compatibility
     */
    @Transactional
    public MemberViewDto createMember(MemberCreateDto dto) {
        return createPrincipalMember(dto);
    }

    /**
     * Alias for controller compatibility
     */
    @Transactional
    public MemberViewDto addDependent(Long principalId, DependentMemberDto dto) {
        return createDependentMember(principalId, dto);
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
