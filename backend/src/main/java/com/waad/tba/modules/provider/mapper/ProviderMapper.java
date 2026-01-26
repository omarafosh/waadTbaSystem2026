package com.waad.tba.modules.provider.mapper;

import org.springframework.stereotype.Component;

import com.waad.tba.modules.provider.dto.ProviderCreateDto;
import com.waad.tba.modules.provider.dto.ProviderSelectorDto;
import com.waad.tba.modules.provider.dto.ProviderUpdateDto;
import com.waad.tba.modules.provider.dto.ProviderViewDto;
import com.waad.tba.modules.provider.entity.Provider;

@Component
public class ProviderMapper {

    /**
     * Maps ProviderCreateDto to Provider entity.
     * Supports both legacy 'name' field and new 'nameArabic'/'nameEnglish' fields.
     * If nameArabic/nameEnglish are provided, they take precedence over 'name'.
     */
    public Provider toEntity(ProviderCreateDto dto) {
        // Support both legacy 'name' and new 'nameArabic'/'nameEnglish'
        String nameAr = dto.getNameArabic() != null ? dto.getNameArabic() : dto.getName();
        String nameEn = dto.getNameEnglish() != null ? dto.getNameEnglish() : dto.getName();
        
        return Provider.builder()
                .nameArabic(nameAr)
                .nameEnglish(nameEn)
                .licenseNumber(dto.getLicenseNumber())
                .taxNumber(dto.getTaxNumber())
                .city(dto.getCity())
                .address(dto.getAddress())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .providerType(dto.getProviderType() != null ? 
                        Provider.ProviderType.valueOf(dto.getProviderType()) : null)
                .networkStatus(dto.getNetworkStatus() != null ? 
                        Provider.NetworkTier.valueOf(dto.getNetworkStatus()) : null)
                .contractStartDate(dto.getContractStartDate())
                .contractEndDate(dto.getContractEndDate())
                .defaultDiscountRate(dto.getDefaultDiscountRate())
                .active(true)
                .build();
    }

    /**
     * Updates Provider entity from ProviderUpdateDto.
     * Supports both legacy 'name' field and new 'nameArabic'/'nameEnglish' fields.
     */
    public void updateEntityFromDto(Provider provider, ProviderUpdateDto dto) {
        // Handle bilingual names - new fields take precedence
        if (dto.getNameArabic() != null) {
            provider.setNameArabic(dto.getNameArabic());
        } else if (dto.getName() != null) {
            // Legacy fallback: use 'name' for Arabic
            provider.setNameArabic(dto.getName());
        }
        if (dto.getNameEnglish() != null) {
            provider.setNameEnglish(dto.getNameEnglish());
        } else if (dto.getName() != null && dto.getNameEnglish() == null && dto.getNameArabic() == null) {
            // Legacy fallback: use 'name' for English too if no bilingual fields provided
            provider.setNameEnglish(dto.getName());
        }
        if (dto.getLicenseNumber() != null) {
            provider.setLicenseNumber(dto.getLicenseNumber());
        }
        if (dto.getTaxNumber() != null) {
            provider.setTaxNumber(dto.getTaxNumber());
        }
        if (dto.getCity() != null) {
            provider.setCity(dto.getCity());
        }
        if (dto.getAddress() != null) {
            provider.setAddress(dto.getAddress());
        }
        if (dto.getPhone() != null) {
            provider.setPhone(dto.getPhone());
        }
        if (dto.getEmail() != null) {
            provider.setEmail(dto.getEmail());
        }
        if (dto.getProviderType() != null) {
            provider.setProviderType(Provider.ProviderType.valueOf(dto.getProviderType()));
        }
        if (dto.getNetworkStatus() != null) {
            provider.setNetworkStatus(Provider.NetworkTier.valueOf(dto.getNetworkStatus()));
        }
        if (dto.getContractStartDate() != null) {
            provider.setContractStartDate(dto.getContractStartDate());
        }
        if (dto.getContractEndDate() != null) {
            provider.setContractEndDate(dto.getContractEndDate());
        }
        if (dto.getDefaultDiscountRate() != null) {
            provider.setDefaultDiscountRate(dto.getDefaultDiscountRate());
        }
        if (dto.getActive() != null) {
            provider.setActive(dto.getActive());
        }
    }

    /**
     * Maps Provider entity to ProviderViewDto.
     * Includes both bilingual fields and legacy 'name' for backward compatibility.
     */
    public ProviderViewDto toViewDto(Provider provider) {
        String typeLabel = provider.getProviderType() != null ? 
                getProviderTypeLabel(provider.getProviderType()) : null;
        String networkStatusLabel = provider.getNetworkStatus() != null ? 
                getNetworkStatusLabel(provider.getNetworkStatus()) : null;
        
        return ProviderViewDto.builder()
                .id(provider.getId())
                .nameArabic(provider.getNameArabic())
                .nameEnglish(provider.getNameEnglish())
                .name(provider.getName()) // Backward compatibility (returns Arabic)
                .licenseNumber(provider.getLicenseNumber())
                .taxNumber(provider.getTaxNumber())
                .city(provider.getCity())
                .address(provider.getAddress())
                .phone(provider.getPhone())
                .email(provider.getEmail())
                .providerType(provider.getProviderType() != null ? 
                        provider.getProviderType().name() : null)
                .providerTypeLabel(typeLabel)
                .networkStatus(provider.getNetworkStatus() != null ? 
                        provider.getNetworkStatus().name() : null)
                .networkStatusLabel(networkStatusLabel)
                .active(provider.getActive())
                .contractStartDate(provider.getContractStartDate())
                .contractEndDate(provider.getContractEndDate())
                .defaultDiscountRate(provider.getDefaultDiscountRate())
                .createdAt(provider.getCreatedAt())
                .updatedAt(provider.getUpdatedAt())
                .build();
    }

    /**
     * Maps Provider entity to ProviderSelectorDto for dropdown lists.
     * Returns both bilingual names and legacy 'name' for compatibility.
     */
    public ProviderSelectorDto toSelectorDto(Provider provider) {
        if (provider == null) return null;
        
        return ProviderSelectorDto.builder()
                .id(provider.getId())
                .code(provider.getLicenseNumber())
                .name(provider.getName()) // Backward compatibility (returns Arabic)
                .nameArabic(provider.getNameArabic())
                .nameEnglish(provider.getNameEnglish())
                .providerType(provider.getProviderType() != null 
                        ? getProviderTypeLabel(provider.getProviderType()) 
                        : null)
                .build();
    }

    private String getProviderTypeLabel(Provider.ProviderType type) {
        return switch (type) {
            case HOSPITAL -> "مستشفى";
            case CLINIC -> "عيادة";
            case LAB -> "مختبر";
            case PHARMACY -> "صيدلية";
            case RADIOLOGY -> "أشعة";
        };
    }

    private String getNetworkStatusLabel(Provider.NetworkTier tier) {
        return switch (tier) {
            case IN_NETWORK -> "داخل الشبكة";
            case OUT_OF_NETWORK -> "خارج الشبكة";
            case PREFERRED -> "مزود مفضل";
        };
    }
}
