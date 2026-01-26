package com.waad.tba.modules.medicalpackage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalPackageDTO {
    
    private Long id;
    private String code;
    private String nameAr;
    private String nameEn;
    private String description;
    private Set<Long> serviceIds;
    private Double totalCoverageLimit;
    private Boolean active;
}
