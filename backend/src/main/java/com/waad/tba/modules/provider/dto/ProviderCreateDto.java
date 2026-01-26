package com.waad.tba.modules.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderCreateDto {
    /**
     * Provider name in Arabic (الاسم بالعربية) - Required
     */
    private String nameArabic;
    
    /**
     * Provider name in English - Required
     */
    private String nameEnglish;
    
    /**
     * @deprecated Use nameArabic/nameEnglish instead
     * Kept for backward compatibility - maps to nameArabic
     */
    @Deprecated
    private String name;
    
    private String licenseNumber;
    private String taxNumber;
    private String city;
    private String address;
    private String phone;
    private String email;
    private String providerType;
    private String networkStatus;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private BigDecimal defaultDiscountRate;
}
