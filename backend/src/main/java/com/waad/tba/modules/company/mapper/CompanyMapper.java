package com.waad.tba.modules.company.mapper;

import com.waad.tba.modules.company.dto.CompanyDto;
import com.waad.tba.modules.company.entity.Company;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between Company entity and DTO
 * Includes branding fields mapping
 */
@Component
public class CompanyMapper {

    public CompanyDto toDto(Company entity) {
        if (entity == null) {
            return null;
        }

        return CompanyDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .active(entity.getActive())
                .isDefault(entity.getIsDefault())
                // Branding fields
                .logoUrl(entity.getLogoUrl())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .website(entity.getWebsite())
                .businessType(entity.getBusinessType())
                .taxNumber(entity.getTaxNumber())
                // Timestamps
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public Company toEntity(CompanyDto dto) {
        if (dto == null) {
            return null;
        }

        return Company.builder()
                .id(dto.getId())
                .name(dto.getName())
                .code(dto.getCode())
                .active(dto.getActive())
                .isDefault(dto.getIsDefault())
                // Branding fields
                .logoUrl(dto.getLogoUrl())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .website(dto.getWebsite())
                .businessType(dto.getBusinessType())
                .taxNumber(dto.getTaxNumber())
                .build();
    }

    public void updateEntityFromDto(CompanyDto dto, Company entity) {
        if (dto == null || entity == null) {
            return;
        }

        entity.setName(dto.getName());
        entity.setCode(dto.getCode());
        
        if (dto.getActive() != null) {
            entity.setActive(dto.getActive());
        }

        // Update branding fields (allow null to clear values)
        entity.setLogoUrl(dto.getLogoUrl());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        entity.setAddress(dto.getAddress());
        entity.setWebsite(dto.getWebsite());
        entity.setBusinessType(dto.getBusinessType());
        entity.setTaxNumber(dto.getTaxNumber());
    }
}
