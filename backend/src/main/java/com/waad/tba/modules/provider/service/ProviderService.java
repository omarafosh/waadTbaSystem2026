package com.waad.tba.modules.provider.service;

import com.waad.tba.modules.provider.dto.ProviderCreateDto;
import com.waad.tba.modules.provider.dto.ProviderSelectorDto;
import com.waad.tba.modules.provider.dto.ProviderUpdateDto;
import com.waad.tba.modules.provider.dto.ProviderViewDto;
import com.waad.tba.modules.provider.entity.Provider;
import com.waad.tba.modules.provider.mapper.ProviderMapper;
import com.waad.tba.modules.provider.repository.ProviderDocumentRepository;
import com.waad.tba.modules.provider.repository.ProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProviderService {

    private final ProviderRepository providerRepository;
    private final ProviderDocumentRepository providerDocumentRepository;
    private final ProviderMapper providerMapper;

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
        return providerMapper.toViewDto(provider, providerDocumentRepository.existsByProviderIdAndActiveTrue(id));
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
}
