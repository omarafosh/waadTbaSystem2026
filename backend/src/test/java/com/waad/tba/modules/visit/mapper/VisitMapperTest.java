package com.waad.tba.modules.visit.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.waad.tba.modules.claim.entity.Claim;
import com.waad.tba.modules.claim.entity.ClaimStatus;
import com.waad.tba.modules.member.entity.Member;
import com.waad.tba.modules.preauthorization.entity.PreAuthorization;
import com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus;
import com.waad.tba.modules.provider.entity.Provider;
import com.waad.tba.modules.provider.repository.ProviderRepository;
import com.waad.tba.modules.visit.dto.VisitResponseDto;
import com.waad.tba.modules.visit.entity.Visit;

@ExtendWith(MockitoExtension.class)
class VisitMapperTest {

    @Mock
    private ProviderRepository providerRepository;

    @InjectMocks
    private VisitMapper visitMapper;

    private Visit visit;
    private Member member;
    private Provider provider;

    @BeforeEach
    void setUp() {
        member = Member.builder()
                .id(1L)
                .fullName("John Doe")
                .cardNumber("CARD123")
                .build();

        provider = Provider.builder()
                .id(100L)
                .name("General Hospital")
                .build();

        visit = Visit.builder()
                .id(10L)
                .member(member)
                .providerId(100L)
                .visitDate(LocalDate.now())
                .doctorName("Dr. Smith")
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void toResponseDto_ShouldMapBasicFields() {
        when(providerRepository.findById(100L)).thenReturn(Optional.of(provider));

        VisitResponseDto dto = visitMapper.toResponseDto(visit);

        assertNotNull(dto);
        assertEquals(visit.getId(), dto.getId());
        assertEquals(member.getId(), dto.getMemberId());
        assertEquals(member.getFullName(), dto.getMemberName());
        assertEquals(provider.getId(), dto.getProviderId());
        assertEquals(provider.getName(), dto.getProviderName());
    }

    @Test
    void toResponseDto_ShouldPopulateClaims() {
        when(providerRepository.findById(100L)).thenReturn(Optional.of(provider));

        Claim claim1 = Claim.builder()
                .id(201L)
                .status(ClaimStatus.SUBMITTED)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        Claim claim2 = Claim.builder()
                .id(202L)
                .status(ClaimStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .build();

        // Simulate lazy loading
        visit.setClaims(Arrays.asList(claim1, claim2));

        VisitResponseDto dto = visitMapper.toResponseDto(visit);

        assertEquals(2, dto.getClaimCount());
        assertEquals(202L, dto.getLatestClaimId());
        assertEquals("APPROVED", dto.getLatestClaimStatus());
    }

    @Test
    void toResponseDto_ShouldPopulatePreAuthorizations() {
        when(providerRepository.findById(100L)).thenReturn(Optional.of(provider));

        PreAuthorization pa1 = PreAuthorization.builder()
                .id(301L)
                .status(PreAuthStatus.PENDING)
                .createdAt(LocalDateTime.now().minusDays(1))
                .active(true)
                .build();

        PreAuthorization pa2 = PreAuthorization.builder()
                .id(302L)
                .status(PreAuthStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();

        // Inactive one should be ignored
        PreAuthorization pa3 = PreAuthorization.builder()
                .id(303L)
                .status(PreAuthStatus.CANCELLED)
                .createdAt(LocalDateTime.now())
                .active(false)
                .build();

        // Simulate lazy loading
        visit.setPreAuthorizations(Arrays.asList(pa1, pa2, pa3));

        VisitResponseDto dto = visitMapper.toResponseDto(visit);

        assertEquals(2, dto.getPreAuthCount()); // Only active ones
        assertEquals(302L, dto.getLatestPreAuthId());
        assertEquals("APPROVED", dto.getLatestPreAuthStatus());
    }
}
