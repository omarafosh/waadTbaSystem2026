package com.waad.tba.modules.visit.mapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.waad.tba.common.entity.Organization;
import com.waad.tba.modules.claim.entity.Claim;
import com.waad.tba.modules.member.entity.Member;
import com.waad.tba.modules.preauthorization.repository.PreAuthorizationRepository;
import com.waad.tba.modules.provider.entity.Provider;
import com.waad.tba.modules.visit.dto.VisitResponseDto;
import com.waad.tba.modules.visit.entity.Visit;

@ExtendWith(MockitoExtension.class)
class VisitMapperTest {

    @Mock
    private PreAuthorizationRepository preAuthorizationRepository;

    @InjectMocks
    private VisitMapper visitMapper;

    private Visit visit;
    private Member member;
    private Provider provider;
    private Organization employer;
    private Claim claim;

    @BeforeEach
    void setUp() {
        employer = new Organization();
        employer.setId(10L);
        employer.setName("Test Employer");

        member = new Member();
        member.setId(1L);
        member.setFullName("Test Member");
        member.setCardNumber("12345");
        member.setEmployerOrganization(employer);

        provider = new Provider();
        provider.setId(5L);
        provider.setName("Test Provider");

        claim = new Claim();
        claim.setId(100L);
        claim.setCreatedAt(java.time.LocalDateTime.now());

        visit = new Visit();
        visit.setId(200L);
        visit.setVisitDate(LocalDate.now());
        visit.setMember(member);
        visit.setProvider(provider); // Accessing the new field
        visit.setProviderId(5L);
        visit.setClaims(List.of(claim));
    }

    @Test
    void toResponseDto_ShouldMapAllFieldsCorrectly() {
        // Arrange
        when(preAuthorizationRepository.findByVisitIdAndActiveTrue(anyLong())).thenReturn(Collections.emptyList());

        // Act
        VisitResponseDto dto = visitMapper.toResponseDto(visit);

        // Assert
        assertNotNull(dto);
        assertEquals(visit.getId(), dto.getId());

        // Member mapping
        assertEquals(member.getId(), dto.getMemberId());
        assertEquals(member.getFullName(), dto.getMemberName());

        // Employer mapping
        assertEquals(employer.getId(), dto.getEmployerId());
        assertEquals(employer.getName(), dto.getEmployerName());

        // Provider mapping (from entity relation)
        assertEquals(provider.getId(), dto.getProviderId());
        assertEquals(provider.getName(), dto.getProviderName());

        // Claim mapping (from entity relation)
        assertEquals(1, dto.getClaimCount());
        assertEquals(claim.getId(), dto.getLatestClaimId());
    }

    @Test
    void toResponseDto_ShouldHandleNullProvider() {
        // Arrange
        visit.setProvider(null);
        when(preAuthorizationRepository.findByVisitIdAndActiveTrue(anyLong())).thenReturn(Collections.emptyList());

        // Act
        VisitResponseDto dto = visitMapper.toResponseDto(visit);

        // Assert
        assertNull(dto.getProviderName());
    }
}
