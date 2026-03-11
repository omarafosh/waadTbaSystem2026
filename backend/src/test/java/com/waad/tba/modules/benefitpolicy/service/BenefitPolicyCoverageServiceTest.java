package com.waad.tba.modules.benefitpolicy.service;

import com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy;
import com.waad.tba.modules.benefitpolicy.entity.BenefitPolicyRule;
import com.waad.tba.modules.benefitpolicy.repository.BenefitPolicyRepository;
import com.waad.tba.modules.benefitpolicy.repository.BenefitPolicyRuleRepository;
import com.waad.tba.modules.claim.repository.ClaimRepository;
import com.waad.tba.modules.medicaltaxonomy.entity.MedicalCategory;
import com.waad.tba.modules.medicaltaxonomy.entity.MedicalService;
import com.waad.tba.modules.medicaltaxonomy.repository.MedicalServiceRepository;
import com.waad.tba.modules.member.entity.Member;
import com.waad.tba.modules.visit.entity.VisitType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BenefitPolicyCoverageServiceTest {

    @Mock
    private BenefitPolicyRepository policyRepository;

    @Mock
    private BenefitPolicyRuleRepository ruleRepository;

    @Mock
    private MedicalServiceRepository serviceRepository;

    @Mock
    private ClaimRepository claimRepository;

    @InjectMocks
    private BenefitPolicyCoverageService service;

    private Member member;
    private BenefitPolicy policy;
    private MedicalService medService1;
    private MedicalService medService2;

    @BeforeEach
    void setUp() {
        policy = new BenefitPolicy();
        policy.setId(1L);
        policy.setDefaultCoveragePercent(80);

        member = new Member();
        member.setId(100L);
        member.setBenefitPolicy(policy);

        MedicalCategory category1 = new MedicalCategory();
        category1.setId(10L);

        medService1 = new MedicalService();
        medService1.setId(101L);
        medService1.setCategoryId(10L);

        medService2 = new MedicalService();
        medService2.setId(102L);
        medService2.setCategoryId(10L);
    }

    @Test
    void batchGetCoveragePercents_Optimized() {
        // Arrange
        List<Long> serviceIds = Arrays.asList(101L, 102L);

        when(serviceRepository.findAllById(serviceIds)).thenReturn(Arrays.asList(medService1, medService2));

        BenefitPolicyRule rule1 = new BenefitPolicyRule();
        rule1.setId(1001L);
        rule1.setMedicalService(medService1);
        rule1.setCoveragePercent(90);

        // mock the new repository method
        when(ruleRepository.findApplicableRulesForServices(eq(1L), eq(serviceIds), eq(Arrays.asList(10L)), eq(VisitType.OUTPATIENT)))
                .thenReturn(Arrays.asList(rule1));

        // Act
        Map<Long, Integer> result = service.batchGetCoveragePercents(member, serviceIds, VisitType.OUTPATIENT);

        // Assert
        assertEquals(2, result.size());
        assertEquals(90, result.get(101L)); // Service specific rule
        assertEquals(80, result.get(102L)); // Policy default
    }
}
