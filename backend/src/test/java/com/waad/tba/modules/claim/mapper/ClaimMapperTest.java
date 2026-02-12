package com.waad.tba.modules.claim.mapper;

import com.waad.tba.modules.claim.dto.ClaimViewDto;
import com.waad.tba.modules.claim.entity.Claim;
import com.waad.tba.modules.claim.entity.ClaimAttachment;
import com.waad.tba.modules.claim.entity.ClaimLine;
import com.waad.tba.modules.claim.entity.ClaimStatus;
import com.waad.tba.modules.member.entity.Member;
import com.waad.tba.common.entity.Organization;
import com.waad.tba.modules.preauthorization.entity.PreAuthorization;
import com.waad.tba.modules.visit.entity.Visit;
import com.waad.tba.modules.member.repository.MemberRepository;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.modules.preauthorization.repository.PreAuthorizationRepository;
import com.waad.tba.modules.visit.repository.VisitRepository;
import com.waad.tba.modules.medicaltaxonomy.repository.MedicalServiceRepository;
import com.waad.tba.modules.providercontract.service.ProviderContractService;
import com.waad.tba.modules.provider.repository.ProviderRepository;
import com.waad.tba.modules.benefitpolicy.service.BenefitPolicyCoverageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ClaimMapperTest {

    @InjectMocks
    private ClaimMapper claimMapper;

    @Mock private MemberRepository memberRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private PreAuthorizationRepository preAuthorizationRepository;
    @Mock private VisitRepository visitRepository;
    @Mock private MedicalServiceRepository medicalServiceRepository;
    @Mock private ProviderContractService providerContractService;
    @Mock private ProviderRepository providerRepository;
    @Mock private BenefitPolicyCoverageService benefitPolicyCoverageService;

    private Claim claim;

    @BeforeEach
    void setUp() {
        Member member = new Member();
        member.setId(101L);
        member.setFullName("Test Member");
        member.setNationalNumber("1234567890");

        Organization insuranceOrg = new Organization();
        insuranceOrg.setId(201L);
        insuranceOrg.setName("Test Insurance");

        Visit visit = new Visit();
        visit.setId(301L);
        visit.setVisitDate(LocalDate.now());

        ClaimLine line1 = ClaimLine.builder().id(1L).totalPrice(new BigDecimal("100.00")).build();
        ClaimLine line2 = ClaimLine.builder().id(2L).totalPrice(new BigDecimal("200.00")).build();
        List<ClaimLine> lines = new ArrayList<>();
        lines.add(line1);
        lines.add(line2);

        ClaimAttachment attachment1 = ClaimAttachment.builder().id(1L).fileName("file1.pdf").build();
        List<ClaimAttachment> attachments = new ArrayList<>();
        attachments.add(attachment1);

        claim = Claim.builder()
                .id(1L)
                .member(member)
                .insuranceOrganization(insuranceOrg)
                .visit(visit)
                .providerId(401L)
                .providerName("Test Provider")
                .doctorName("Dr. Smith")
                .diagnosisCode("A00")
                .diagnosisDescription("Test Diagnosis")
                .serviceDate(LocalDate.now())
                .requestedAmount(new BigDecimal("300.00"))
                .status(ClaimStatus.SUBMITTED)
                .serviceCount(2)
                .attachmentsCount(1)
                .lines(lines)
                .attachments(attachments)
                .build();
    }

    @Test
    void testToSummaryDto_ShouldNotMapLinesOrAttachments() {
        ClaimViewDto summaryDto = claimMapper.toSummaryDto(claim);

        assertNotNull(summaryDto);
        assertEquals(claim.getId(), summaryDto.getId());
        assertEquals("Test Provider", summaryDto.getProviderName());
        assertEquals(new BigDecimal("300.00"), summaryDto.getRequestedAmount());

        // Verify collections are empty
        assertNotNull(summaryDto.getLines());
        assertTrue(summaryDto.getLines().isEmpty(), "Lines should be empty in summary DTO");

        assertNotNull(summaryDto.getAttachments());
        assertTrue(summaryDto.getAttachments().isEmpty(), "Attachments should be empty in summary DTO");

        // Verify counts are mapped
        assertEquals(2, summaryDto.getServiceCount());
        assertEquals(1, summaryDto.getAttachmentsCount());
    }

    @Test
    void testToViewDto_ShouldMapLinesAndAttachments() {
        ClaimViewDto viewDto = claimMapper.toViewDto(claim);

        assertNotNull(viewDto);
        assertEquals(claim.getId(), viewDto.getId());

        // Verify collections are populated
        assertNotNull(viewDto.getLines());
        assertEquals(2, viewDto.getLines().size(), "Lines should be mapped in view DTO");

        assertNotNull(viewDto.getAttachments());
        assertEquals(1, viewDto.getAttachments().size(), "Attachments should be mapped in view DTO");
    }
}
