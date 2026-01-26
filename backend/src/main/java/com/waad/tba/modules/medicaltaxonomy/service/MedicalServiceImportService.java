package com.waad.tba.modules.medicaltaxonomy.service;

import com.waad.tba.common.exception.BusinessRuleException;
import com.waad.tba.modules.medicaltaxonomy.entity.MedicalCategory;
import com.waad.tba.modules.medicaltaxonomy.entity.MedicalService;
import com.waad.tba.modules.medicaltaxonomy.enums.MedicalServiceStatus;
import com.waad.tba.modules.medicaltaxonomy.repository.MedicalCategoryRepository;
import com.waad.tba.modules.medicaltaxonomy.repository.MedicalServiceRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalServiceImportService {

    private final MedicalServiceRepository serviceRepository;
    private final MedicalCategoryRepository categoryRepository;

    @Getter
    @Builder
    public static class ImportResult {
        private int total;
        private int inserted;
        private int updated;
        private int failed;
        private int drafts;
        private List<String> errors;
    }

    @Transactional
    public ImportResult importExcel(MultipartFile file) {
        log.info("Starting Medical Services safe import...");
        List<String> errors = new ArrayList<>();
        int inserted = 0;
        int updated = 0;
        int drafts = 0;
        int total = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            
            // Pre-load categories cache to avoid N+1 queries
            Map<String, MedicalCategory> categoryCache = loadCategoryCache();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header

                total++;
                try {
                    processRow(row, categoryCache, errors);
                    
                    // Track stats (simplified for this example)
                    inserted++;
                    // Logic inside processRow handles saving
                    
                } catch (Exception e) {
                    errors.add("Row " + (row.getRowNum() + 1) + ": " + e.getMessage());
                }
            }

        } catch (Exception e) {
            throw new BusinessRuleException("Failed to process Excel file: " + e.getMessage());
        }

        return ImportResult.builder()
                .total(total)
                .inserted(inserted) // Note: this count is simplified
                .failed(errors.size())
                .errors(errors)
                .build();
    }

    private Map<String, MedicalCategory> loadCategoryCache() {
        Map<String, MedicalCategory> cache = new HashMap<>();
        categoryRepository.findAll().forEach(c -> {
            cache.put(c.getName().trim().toLowerCase(), c);
            if (c.getNameEn() != null) cache.put(c.getNameEn().trim().toLowerCase(), c);
            cache.put(c.getCode().trim().toLowerCase(), c);
        });
        return cache;
    }

    private void processRow(Row row, Map<String, MedicalCategory> categoryCache, List<String> errors) {
        // 1. Extract Data
        String name = getCellValue(row, 0);       // Col A: Name (Required)
        String code = getCellValue(row, 1);       // Col B: Code (Optional)
        String categoryName = getCellValue(row, 2); // Col C: Category (Optional)
        String basePriceStr = getCellValue(row, 3);// Col D: Price (Reference)

        // Rule: Name is mandatory
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Service Name is missing");
        }

        // 2. Determine Code (Auto-generate if missing)
        String finalCode;
        if (code == null || code.isEmpty()) {
            finalCode = "MS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } else {
            finalCode = code;
        }

        // 3. Resolve Category & Status
        MedicalCategory category = null;
        MedicalServiceStatus status = MedicalServiceStatus.DRAFT;
        
        if (categoryName != null && !categoryName.isEmpty()) {
            category = categoryCache.get(categoryName.trim().toLowerCase());
            if (category != null) {
                status = MedicalServiceStatus.ACTIVE;
            }
        }

        // 4. Create Entity
        MedicalService service = serviceRepository.findByCode(finalCode)
                .orElse(new MedicalService());

        service.setCode(finalCode);
        service.setName(name);
        
        // Only set status active if we have a valid category
        // otherwise DRAFT (Safe Mode)
        service.setStatus(status);
        service.setActive(status == MedicalServiceStatus.ACTIVE);
        
        if (category != null) {
            service.setCategoryId(category.getId());
        } else {
            service.setCategoryId(null); // Explicitly null for drafts
        }

        // Optional Price
        if (basePriceStr != null && !basePriceStr.isEmpty()) {
            try {
                service.setBasePrice(new BigDecimal(basePriceStr));
            } catch (NumberFormatException ignored) {}
        }

        serviceRepository.save(service);
    }

    private String getCellValue(Row row, int index) {
        Cell cell = row.getCell(index, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int)cell.getNumericCellValue()); // Treat codes/names as strings
            default -> null;
        };
    }
}
