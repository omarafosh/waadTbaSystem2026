package com.waad.tba.modules.provider.service;

import com.waad.tba.common.entity.Organization;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.modules.provider.dto.AllowedEmployerDto;
import com.waad.tba.modules.provider.dto.ProviderCreateDto;
import com.waad.tba.modules.provider.dto.ProviderSelectorDto;
import com.waad.tba.modules.provider.dto.ProviderUpdateDto;
import com.waad.tba.modules.provider.dto.ProviderViewDto;
import com.waad.tba.modules.provider.entity.Provider;
import com.waad.tba.modules.provider.mapper.ProviderMapper;
import com.waad.tba.modules.provider.repository.ProviderDocumentRepository;
import com.waad.tba.modules.provider.repository.ProviderRepository;
import com.waad.tba.modules.providercontract.entity.ProviderContract;
import com.waad.tba.modules.providercontract.entity.ProviderContract.ContractStatus;
import com.waad.tba.modules.providercontract.entity.ProviderContract.PricingModel;
import com.waad.tba.modules.providercontract.repository.ProviderContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProviderService {

    private final ProviderRepository providerRepository;
    private final ProviderDocumentRepository providerDocumentRepository;
    private final ProviderMapper providerMapper;
    private final ProviderContractRepository providerContractRepository;
    private final OrganizationRepository organizationRepository;

    public List<ProviderSelectorDto> getSelectorOptions() {
        return providerRepository.findAllActive().stream()
                .map(providerMapper::toSelectorDto)
                .collect(Collectors.toList());
    }

    public List<ProviderViewDto> search(String query) {
        return providerRepository.search(query).stream()
                .map(p -> providerMapper.toViewDto(p, providerDocumentRepository.existsByProviderIdAndActiveTrue(p.getId())))
                .collect(Collectors.toList());
    }

    public ProviderViewDto createProvider(ProviderCreateDto dto) {
        if (providerRepository.existsByLicenseNumber(dto.getLicenseNumber())) {
            throw new RuntimeException("Provider with license number already exists: " + dto.getLicenseNumber());
        }

        Provider provider = providerMapper.toEntity(dto);
        provider = providerRepository.save(provider);
        return providerMapper.toViewDto(provider, false);
    }

    public ProviderViewDto updateProvider(Long id, ProviderUpdateDto dto) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found with id: " + id));

        providerMapper.updateEntityFromDto(provider, dto);
        provider = providerRepository.save(provider);

        // Handle allowed payers synchronization
        if (dto.getAllowedPayers() != null) {
            // LEGACY SYNC REMOVED: Allowed Payers are now managed via Contracts only.
            log.warn("⚠️ Attempted to sync legacy Allowed Payers. This feature is deprecated. Use Contracts instead.");
        }

        return providerMapper.toViewDto(provider, providerDocumentRepository.existsByProviderIdAndActiveTrue(id));
    }



    @Transactional(readOnly = true)
    public List<AllowedEmployerDto> getAllowedEmployers(Long providerId) {
        // 1. Get Provider to check TPA Model and Global Flag
        Provider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found with id: " + providerId));
            
        Set<AllowedEmployerDto> distinctEmployers = new HashSet<>();

        // 2. Add Global Network if enabled
        if (Boolean.TRUE.equals(provider.getAllowAllEmployers())) {
             distinctEmployers.add(AllowedEmployerDto.builder()
                .id(-1L) // Virtual ID for Global
                .name("الشبكة العامة") 
                .nameEn("Global Network")
                .isGlobal(true)
                .isActive(true)
                .build());
        }

        // 3. Add TPA Model Employers (The "Allowed" List)
        if (provider.getAllowedEmployers() != null) {
            provider.getAllowedEmployers().stream()
                .filter(pae -> Boolean.TRUE.equals(pae.getActive()) && pae.getEmployer() != null)
                .forEach(pae -> {
                    distinctEmployers.add(AllowedEmployerDto.builder()
                        .id(pae.getEmployer().getId())
                        .name(pae.getEmployer().getName())
                        // Use name as nameEn if nameEn is missing/unified
                        .nameEn(pae.getEmployer().getName()) 
                        .isGlobal(false)
                        .isActive(true)
                        .build());
                });
        }

        // 4. Add Contract Model Employers (The "Contracted" List)
        List<ProviderContract> activeContracts = providerContractRepository
            .findByProviderIdAndStatusAndActiveTrue(providerId, ContractStatus.ACTIVE);
            
        activeContracts.forEach(contract -> {
            if (contract.getEmployer() != null) {
                // Specific Employer Contract
                distinctEmployers.add(AllowedEmployerDto.builder()
                    .id(contract.getEmployer().getId())
                    .name(contract.getEmployer().getName())
                    .nameEn(contract.getEmployer().getName())
                    .isGlobal(false)
                    .isActive(true)
                    .build());
            } else {
                // Global Contract -> Add Global Badge
                 distinctEmployers.add(AllowedEmployerDto.builder()
                    .id(-1L) 
                    .name("الشبكة العامة") 
                    .nameEn("Global Network")
                    .isGlobal(true)
                    .isActive(true)
                    .build());
            }
        });

        // 5. Return sorted list (Global first, then alphabetical)
        return distinctEmployers.stream()
            .sorted((a, b) -> {
                if (Boolean.TRUE.equals(a.getIsGlobal())) return -1;
                if (Boolean.TRUE.equals(b.getIsGlobal())) return 1;
                return a.getName().compareTo(b.getName());
            })
            .collect(Collectors.toList());
    }



    @Transactional(readOnly = true)
    public ProviderViewDto getProvider(Long id) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found with id: " + id));
        return providerMapper.toViewDto(provider, providerDocumentRepository.existsByProviderIdAndActiveTrue(id));
    }

    @Transactional(readOnly = true)
    public Page<ProviderViewDto> listProviders(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Provider> providers;
        
        if (search != null && !search.isEmpty()) {
            // Search ALL providers (active AND inactive)
            providers = providerRepository.searchPagedAll(search, pageable);
        } else {
            // Return ALL providers (active AND inactive)  
            providers = providerRepository.findAll(pageable);
        }
        
        return providers.map(p -> providerMapper.toViewDto(p, providerDocumentRepository.existsByProviderIdAndActiveTrue(p.getId())));
    }

    public void deleteProvider(Long id) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found with id: " + id));
        provider.setActive(false);
        providerRepository.save(provider);
    }

    @Transactional(readOnly = true)
    public List<ProviderViewDto> getAllActiveProviders() {
        return providerRepository.findAllActive().stream()
                .map(p -> providerMapper.toViewDto(p, providerDocumentRepository.existsByProviderIdAndActiveTrue(p.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countProviders() {
        return providerRepository.countActive();
    }

    @Transactional(readOnly = true)
    public List<Long> getAllowedEmployerIds(Long providerId) {
        return getAllowedEmployers(providerId).stream()
                .map(AllowedEmployerDto::getId)
                .filter(id -> id > 0)
                .collect(Collectors.toList());
    }
}
