package com.waad.tba.modules.member.service;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waad.tba.common.exception.BusinessRuleException;
import com.waad.tba.modules.employer.entity.Employer;
import com.waad.tba.modules.employer.repository.EmployerRepository;
import com.waad.tba.modules.benefitpolicy.entity.BenefitPolicy;
import com.waad.tba.modules.benefitpolicy.repository.BenefitPolicyRepository;
import com.waad.tba.modules.member.dto.MemberImportPreviewDto;
import com.waad.tba.modules.member.dto.MemberImportPreviewDto.ImportValidationErrorDto;
import com.waad.tba.modules.member.dto.MemberImportPreviewDto.MemberImportRowDto;
import com.waad.tba.modules.member.dto.MemberImportResultDto;
import com.waad.tba.modules.member.dto.MemberImportResultDto.ImportErrorDetailDto;
import com.waad.tba.modules.member.entity.Member;
import com.waad.tba.modules.member.entity.Member.Gender;
import com.waad.tba.modules.member.entity.Member.MemberStatus;
import com.waad.tba.modules.member.entity.MemberAttribute;
import com.waad.tba.modules.member.entity.MemberAttribute.AttributeSource;
import com.waad.tba.modules.member.entity.MemberImportError;
import com.waad.tba.modules.member.entity.MemberImportLog;
import com.waad.tba.modules.member.entity.MemberImportLog.ImportStatus;
import com.waad.tba.modules.member.repository.MemberAttributeRepository;
import com.waad.tba.modules.member.repository.MemberImportErrorRepository;
import com.waad.tba.modules.member.repository.MemberImportLogRepository;
import com.waad.tba.modules.member.repository.MemberRepository;
import com.waad.tba.common.entity.Organization;
import com.waad.tba.common.enums.OrganizationType;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.modules.rbac.entity.User;
import com.waad.tba.security.AuthorizationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.waad.tba.modules.member.service.BarcodeGeneratorService;

/**
 * Service for importing members from Excel files.
 * 
 * Compatible with Odoo hr.employee.public exports.
 * 
 * UNIQUE IDENTIFIER: AUTO-GENERATED BARCODE (WAAD|MEMBER|...)
 * - Members are ALWAYS CREATED NEW
 * - card_number from Excel is IGNORED (Security/Identity Safety)
 * - Matching by name/civil_id is DISABLED for Phase 1
 * - BenefitPolicy assignment is done separately (not via Excel import)
 * 
 * Column Mappings (Odoo → TBA):
 * - name / full_name → fullName (MANDATORY)
 * - company / employer → employerOrganization (MANDATORY LOOKUP)
 * - national_id / civil_id → civilId (optional, no uniqueness constraint)
 * - barcode / badge_id → IGNORED
 * - card_number → IGNORED
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberExcelImportService {

    private final MemberRepository memberRepository;
    private final MemberAttributeRepository attributeRepository;
    private final MemberImportLogRepository importLogRepository;
    private final MemberImportErrorRepository importErrorRepository;
    private final EmployerRepository employerRepository;
    private final BenefitPolicyRepository benefitPolicyRepository;
    private final OrganizationRepository organizationRepository;
    private final AuthorizationService authorizationService;
    private final ObjectMapper objectMapper;
    private final BarcodeGeneratorService barcodeGeneratorService; // RADICAL FIX: Enforce canonical barcode on import

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN MAPPINGS (Odoo Compatible + Enhanced Arabic Support)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Mandatory columns (at least one variant required)
     */
    private static final List<String[]> MANDATORY_COLUMNS = List.of(
            // Full Name - الاسم الكامل (MANDATORY)
            new String[] {
                    "full_name", "name", "full_name_arabic", "fullname", "member_name",
                    "الاسم الكامل", "الاسم", "اسم الموظف", "الاسم بالعربية", "اسم العضو",
                    "الاسم الثلاثي", "الاسم الرباعي", "اسم المؤمن عليه"
            },
            // Employer - جهة العمل (MANDATORY)
            new String[] {
                    "employer", "company", "company_id", "company_name", "employer_name",
                    "work_company", "organization", "employer_code",
                    "جهة العمل", "الشركة", "اسم الشركة", "المؤسسة", "جهة الانتساب",
                    "صاحب العمل", "الجهة", "مكان العمل", "كود الجهة"
            });

    /**
     * Optional core field mappings with enhanced Arabic support
     * NOTE: national_id/civil_id is OPTIONAL
     * NOTE: card_number is IGNORED
     */
    private static final Map<String, String[]> OPTIONAL_FIELD_MAPPINGS = Map.ofEntries(
            // Civil ID - الرقم الوطني
            Map.entry("civilId", new String[] {
                    "national_id", "identification_id", "civil_id", "civilid", "national_number",
                    "id_number", "identity_number",
                    "الرقم الوطني", "رقم الهوية", "الرقم المدني", "رقم البطاقة الشخصية",
                    "رقم الهوية الوطنية"
            }),
            // Card Number / Barcode - IGNORED
            Map.entry("cardNumber", new String[] {
                    "card_number", "cardnumber", "card number", "member_no", "member_number",
                    "insurance_no", "insurance_number", "membership_no", "membership_number",
                    "barcode", "badge_id", "employee_id",
                    "رقم البطاقة", "رقم العضوية", "رقم التأمين", "رقم العضو", "رقم بطاقة التأمين",
                    "الباركود", "رقم الشارة"
            }),
            // Birth Date - تاريخ الميلاد
            Map.entry("birthDate", new String[] {
                    "birth_date", "birthday", "dob", "date_of_birth", "birthdate",
                    "تاريخ الميلاد", "تاريخ الولادة", "الميلاد"
            }),
            // Gender - الجنس
            Map.entry("gender", new String[] {
                    "gender", "sex",
                    "الجنس", "النوع"
            }),
            // Phone - الهاتف
            Map.entry("phone", new String[] {
                    "phone", "mobile", "mobile_phone", "work_phone", "phone_number",
                    "telephone", "tel", "cell", "cellphone",
                    "الهاتف", "الجوال", "رقم الهاتف", "رقم الجوال", "هاتف العمل",
                    "الموبايل", "رقم التواصل"
            }),
            // Email - البريد الإلكتروني
            Map.entry("email", new String[] {
                    "email", "work_email", "email_address", "e_mail",
                    "البريد الإلكتروني", "الإيميل", "البريد"
            }),
            // Nationality - الجنسية
            Map.entry("nationality", new String[] {
                    "nationality", "country", "country_id",
                    "الجنسية", "البلد"
            }),
            // Employee Number - رقم الموظف
            Map.entry("employeeNumber", new String[] {
                    "employee_number", "employee_id", "badge_id", "barcode", "emp_no",
                    "employee_code", "staff_id",
                    "رقم الموظف", "الرقم الوظيفي", "رقم العمل", "كود الموظف"
            }),
            // Address - العنوان
            Map.entry("address", new String[] {
                    "address", "home_address", "street", "location",
                    "العنوان", "عنوان السكن", "الموقع"
            }),
            // Marital Status - الحالة الاجتماعية
            Map.entry("maritalStatus", new String[] {
                    "marital_status", "marital", "status_marital",
                    "الحالة الاجتماعية", "الحالة الزوجية"
            }));

    /**
     * Columns that go to attributes (Odoo fields) with enhanced Arabic support
     */
    private static final Map<String, String[]> ATTRIBUTE_MAPPINGS = Map.ofEntries(
            // Job Title - المسمى الوظيفي
            Map.entry("job_title", new String[] {
                    "job_title", "job_id", "job", "position", "title", "job_position",
                    "الوظيفة", "المسمى الوظيفي", "المنصب", "الدرجة الوظيفية"
            }),
            // Department - القسم
            Map.entry("department", new String[] {
                    "department", "department_id", "dept", "division", "section",
                    "القسم", "الإدارة", "الوحدة", "الفرع"
            }),
            // Work Location - موقع العمل
            Map.entry("work_location", new String[] {
                    "work_location", "work_location_id", "location", "office", "branch",
                    "موقع العمل", "مكان العمل", "الفرع", "المكتب"
            }),
            // Grade - الدرجة
            Map.entry("grade", new String[] {
                    "grade", "x_grade", "level", "rank", "class",
                    "الدرجة", "المستوى", "الرتبة", "الفئة"
            }),
            // Manager - المدير
            Map.entry("manager", new String[] {
                    "manager", "parent_id", "manager_name", "supervisor", "direct_manager",
                    "المدير", "المسؤول", "المدير المباشر"
            }),
            // Cost Center - مركز التكلفة
            Map.entry("cost_center", new String[] {
                    "cost_center", "x_cost_center", "cost_code",
                    "مركز التكلفة", "رمز التكلفة"
            }),
            // Start Date - تاريخ البداية
            Map.entry("start_date", new String[] {
                    "start_date", "join_date", "hire_date", "employment_date",
                    "تاريخ البداية", "تاريخ الالتحاق", "تاريخ التعيين"
            }),
            // End Date - تاريخ النهاية
            Map.entry("end_date", new String[] {
                    "end_date", "termination_date", "leave_date",
                    "تاريخ النهاية", "تاريخ الانتهاء"
            }),
            // Benefit Class - فئة المنافع
            Map.entry("benefit_class", new String[] {
                    "benefit_class", "class", "coverage_class", "plan_class",
                    "فئة المنافع", "فئة التغطية", "الفئة"
            }),
            // Notes - ملاحظات
            Map.entry("notes", new String[] {
                    "notes", "remarks", "comment", "comments",
                    "ملاحظات", "تعليقات"
            }));

    // ═══════════════════════════════════════════════════════════════════════════
    // PREVIEW (Parse and Validate without committing)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Parse Excel file and return preview without importing (with default mappings).
     */
    public MemberImportPreviewDto parseAndPreview(MultipartFile file) throws Exception {
        return parseAndPreview(file, null);
    }

    /**
     * Parse Excel file and return preview without importing.
     * 
     * Features:
     * - Auto-mapping for Arabic/English column headers
     * - Lenient validation with WARNING status for non-critical issues
     * - Only ERROR rows are skipped, WARNING rows are imported
     * - Accepts custom column mappings (excelColumn → systemField)
     * 
     * @param file Excel file
     * @param customMappings Optional map of Excel column names to system field names
     */
    public MemberImportPreviewDto parseAndPreview(MultipartFile file, Map<String, String> customMappings) throws Exception {
        log.info("📊 Parsing Excel file for preview: {} (custom mappings: {})", 
                file.getOriginalFilename(), customMappings != null ? "yes" : "auto");

        String batchId = UUID.randomUUID().toString();
        List<MemberImportRowDto> previewRows = new ArrayList<>();
        List<ImportValidationErrorDto> validationErrors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Map<String, String> columnMappings = new LinkedHashMap<>();
        List<String> detectedColumns = new ArrayList<>();

        int newCount = 0;
        int updateCount = 0;
        int warningCount = 0;
        int errorCount = 0;

        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            int totalRows = sheet.getLastRowNum(); // Excluding header

            // Parse header row
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BusinessRuleException("Excel file has no header row");
            }

            Map<Integer, String> columnIndexToName = new HashMap<>();
            Map<String, Integer> fieldToColumnIndex = new HashMap<>();

            // Build column index map first
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String colName = getCellStringValue(cell);
                if (colName == null)
                    colName = "";
                columnIndexToName.put(i, colName.trim().toLowerCase());
                detectedColumns.add(colName.trim());
            }

            // Use custom mappings if provided, otherwise auto-map
            if (customMappings != null && !customMappings.isEmpty()) {
                log.info("🎯 Using custom column mappings: {}", customMappings);
                
                for (Map.Entry<String, String> entry : customMappings.entrySet()) {
                    String excelColumn = entry.getKey().trim().toLowerCase();
                    String systemField = entry.getValue();
                    
                    // Find column index by name
                    Integer columnIndex = findColumnIndexByName(excelColumn, columnIndexToName);
                    if (columnIndex != null) {
                        fieldToColumnIndex.put(systemField, columnIndex);
                        columnMappings.put(systemField, excelColumn);
                        log.debug("  ✓ Mapped '{}' → {}", excelColumn, systemField);
                    } else {
                        log.warn("  ⚠ Excel column '{}' not found in file", excelColumn);
                    }
                }
            } else {
                log.info("🔍 Using auto-mapping for columns");
                
                // Auto-map columns using existing logic
                for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                    String colName = columnIndexToName.get(i);
                    mapColumnToField(colName, i, fieldToColumnIndex, columnMappings);
                }
            }

            // Validate mandatory columns exist (only card_number and full_name are truly
            // mandatory)
            validateMandatoryColumns(fieldToColumnIndex, validationErrors);

            // Parse data rows (limit preview to 50 rows)
            int previewLimit = Math.min(totalRows, 50);
            Set<String> seenCardNumbers = new HashSet<>();

            for (int rowNum = 1; rowNum <= totalRows; rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null || isEmptyRow(row))
                    continue;

                MemberImportRowDto rowDto = parseRow(row, rowNum, fieldToColumnIndex,
                        columnIndexToName, validationErrors, seenCardNumbers);

                // Determine row status based on validation results
                boolean hasErrors = rowDto.getErrors() != null && !rowDto.getErrors().isEmpty();
                boolean hasWarnings = rowDto.getWarnings() != null && !rowDto.getWarnings().isEmpty();

                if (hasErrors) {
                    // Critical errors - row will be skipped
                    rowDto.setStatus("ERROR");
                    errorCount++;
                } else {
                    // Phase 1 Enterprise Fix: ALWAYS NEW
                    // We treat every row as a new member insertion.
                    // Identity is managed by auto-generated card numbers.
                    rowDto.setStatus(hasWarnings ? "WARNING" : "NEW");
                    newCount++;

                    if (hasWarnings) {
                        warningCount++;
                    }
                }

                if (rowNum <= previewLimit) {
                    previewRows.add(rowDto);
                }
            }

            // Add informational warnings
            if (totalRows > previewLimit) {
                warnings.add(String.format("عرض أول %d صف من إجمالي %d صف", previewLimit, totalRows));
            }

            // Summary info
            int importableCount = newCount + updateCount;
            if (warningCount > 0) {
                warnings.add(String.format("%d صف بها تحذيرات - ستُستورد مع ملاحظات", warningCount));
            }
            if (errorCount > 0) {
                warnings.add(String.format("%d صف بها أخطاء - سيتم تخطيها", errorCount));
            }

            // NEW: Load available employers for selection
            List<Employer> allEmployers = employerRepository.findAll();
            List<MemberImportPreviewDto.EmployerOptionDto> employerOptions = allEmployers.stream()
                    .map(e -> MemberImportPreviewDto.EmployerOptionDto.builder()
                            .id(e.getId())
                            .code(e.getCode())
                            .nameAr(e.getNameAr())
                            .nameEn(e.getNameEn())
                            .active(e.getActive())
                            .build())
                    .toList();
            
            // NEW: Load available benefit policies for selection
            List<BenefitPolicy> allPolicies = benefitPolicyRepository.findAll();
            List<MemberImportPreviewDto.BenefitPolicyOptionDto> policyOptions = allPolicies.stream()
                    .map(p -> MemberImportPreviewDto.BenefitPolicyOptionDto.builder()
                            .id(p.getId())
                            .policyNumber(p.getPolicyCode())
                            .nameAr(p.getName())
                            .nameEn(p.getName())
                            .employerId(p.getEmployerOrganization() != null ? p.getEmployerOrganization().getId() : null)
                            .isActive(p.getStatus() == BenefitPolicy.BenefitPolicyStatus.ACTIVE)
                            .build())
                    .toList();

            return MemberImportPreviewDto.builder()
                    .batchId(batchId)
                    .fileName(file.getOriginalFilename())
                    .totalRows(totalRows)
                    .newCount(newCount)
                    .updateCount(updateCount)
                    .warningCount(warningCount)
                    .errorCount(errorCount)
                    .detectedColumns(detectedColumns)
                    .columnMappings(columnMappings)
                    .previewRows(previewRows)
                    .validationErrors(validationErrors)
                    .canProceed(importableCount > 0) // Can proceed if any rows are valid
                    .matchKeyUsed("CARD_NUMBER")
                    .warnings(warnings)
                    .availableEmployers(employerOptions)  // NEW
                    .availableBenefitPolicies(policyOptions)  // NEW
                    .build();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPORT (Commit after confirmation)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Execute import after user confirmation.
     * 
     * @param file Excel file
     * @param batchId Batch ID from preview
     * @param employerId Selected employer ID (REQUIRED)
     * @param benefitPolicyId Selected benefit policy ID (OPTIONAL)
     */
    @Transactional
    public MemberImportResultDto executeImport(
            MultipartFile file, 
            String batchId,
            Long employerId,
            Long benefitPolicyId) throws Exception {
        
        log.info("📥 Executing member import: batchId={}, file={}, employer={}, policy={}", 
                batchId, file.getOriginalFilename(), employerId, benefitPolicyId);

        // Validate employer exists (REQUIRED)
        if (employerId == null) {
            throw new BusinessRuleException("يجب تحديد صاحب العمل");
        }
        
        Organization employerOrg = organizationRepository.findById(employerId)
                .orElseThrow(() -> new BusinessRuleException("صاحب العمل غير موجود: " + employerId));
        
        if (employerOrg.getType() != OrganizationType.EMPLOYER) {
            throw new BusinessRuleException("المنظمة المحددة ليست صاحب عمل");
        }
        
        // Validate policy if provided (OPTIONAL)
        BenefitPolicy benefitPolicy = null;
        if (benefitPolicyId != null) {
            benefitPolicy = benefitPolicyRepository.findById(benefitPolicyId)
                    .orElseThrow(() -> new BusinessRuleException("وثيقة المنافع غير موجودة: " + benefitPolicyId));
            
            log.info("✅ Benefit policy selected: {}", benefitPolicy.getPolicyCode());
        } else {
            log.info("ℹ️ No benefit policy selected - will use employer's active policy if available");
        }

        User currentUser = authorizationService.getCurrentUser();

        // Create import log
        MemberImportLog importLog = MemberImportLog.builder()
                .importBatchId(batchId)
                .fileName(file.getOriginalFilename())
                .fileSizeBytes(file.getSize())
                .status(ImportStatus.PROCESSING)
                .importedByUserId(currentUser != null ? currentUser.getId() : null)
                .importedByUsername(currentUser != null ? currentUser.getUsername() : "system")
                .build();
        importLog.markStarted();
        importLog = importLogRepository.save(importLog);

        List<ImportErrorDetailDto> errors = new ArrayList<>();
        int totalProcessed = 0;
        int createdCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;

        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            int totalRows = sheet.getLastRowNum();
            importLog.setTotalRows(totalRows);

            // Parse header
            Row headerRow = sheet.getRow(0);
            Map<Integer, String> columnIndexToName = new HashMap<>();
            Map<String, Integer> fieldToColumnIndex = new HashMap<>();
            Map<String, String> columnMappings = new LinkedHashMap<>();

            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                String colName = getCellStringValue(headerRow.getCell(i)).trim().toLowerCase();
                columnIndexToName.put(i, colName);
                mapColumnToField(colName, i, fieldToColumnIndex, columnMappings);
            }

            // Process rows
            for (int rowNum = 1; rowNum <= totalRows; rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null || isEmptyRow(row)) {
                    skippedCount++;
                    continue;
                }

                totalProcessed++;

                try {
                    ImportRowResult result = processRow(row, rowNum, fieldToColumnIndex,
                            columnIndexToName, importLog, employerOrg, benefitPolicy);

                    if (result.isCreated()) {
                        createdCount++;
                        importLog.incrementCreated();
                    } else if (result.isUpdated()) {
                        updatedCount++;
                        importLog.incrementUpdated();
                    } else if (result.isSkipped()) {
                        skippedCount++;
                        importLog.incrementSkipped();
                    }

                } catch (Exception e) {
                    errorCount++;
                    importLog.incrementError();

                    String rowJson = rowToJson(row, columnIndexToName);
                    MemberImportError error = MemberImportError.systemError(
                            importLog, rowNum, e.getMessage(), rowJson);
                    importErrorRepository.save(error);

                    errors.add(ImportErrorDetailDto.builder()
                            .rowNumber(rowNum)
                            .errorType("SYSTEM")
                            .message(e.getMessage())
                            .build());
                }
            }

            // Complete import
            importLog.setCreatedCount(createdCount);
            importLog.setUpdatedCount(updatedCount);
            importLog.setSkippedCount(skippedCount);
            importLog.setErrorCount(errorCount);
            importLog.markCompleted();
            importLogRepository.save(importLog);

            double successRate = totalProcessed > 0
                    ? (double) (createdCount + updatedCount) / totalProcessed * 100
                    : 0;

            String message = String.format(
                    "تم استيراد %d عضو: %d جديد، %d تحديث، %d أخطاء",
                    createdCount + updatedCount, createdCount, updatedCount, errorCount);

            log.info("✅ Import completed: {}", message);

            return MemberImportResultDto.builder()
                    .batchId(batchId)
                    .status(importLog.getStatus().name())
                    .totalProcessed(totalProcessed)
                    .createdCount(createdCount)
                    .updatedCount(updatedCount)
                    .skippedCount(skippedCount)
                    .errorCount(errorCount)
                    .processingTimeMs(importLog.getProcessingTimeMs())
                    .completedAt(importLog.getCompletedAt())
                    .successRate(successRate)
                    .errors(errors)
                    .message(message)
                    .build();

        } catch (Exception e) {
            log.error("❌ Import failed: {}", e.getMessage(), e);
            importLog.markFailed(e.getMessage());
            importLogRepository.save(importLog);
            throw e;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find column index by Excel column name (case-insensitive)
     */
    private Integer findColumnIndexByName(String columnName, Map<Integer, String> columnIndexToName) {
        String lowerName = columnName.toLowerCase();
        for (Map.Entry<Integer, String> entry : columnIndexToName.entrySet()) {
            if (entry.getValue().equals(lowerName)) {
                return entry.getKey();
            }
        }
        return null;
    }

    private void mapColumnToField(String colName, int index,
            Map<String, Integer> fieldToColumnIndex, Map<String, String> columnMappings) {

        // Mandatory columns mapping based on new order:
        // 0: Full Name
        // 1: Employer
        // 2: Policy
        for (int i = 0; i < MANDATORY_COLUMNS.size(); i++) {
            String[] variants = MANDATORY_COLUMNS.get(i);
            String fieldName = i == 0 ? "fullName" : i == 1 ? "employer" : "policy";

            for (String variant : variants) {
                if (colName.equalsIgnoreCase(variant) || colName.contains(variant)) {
                    fieldToColumnIndex.put(fieldName, index);
                    columnMappings.put(colName, fieldName);
                    return;
                }
            }
        }

        // Optional core fields (including civilId which is now optional)
        for (Map.Entry<String, String[]> entry : OPTIONAL_FIELD_MAPPINGS.entrySet()) {
            for (String variant : entry.getValue()) {
                if (colName.equalsIgnoreCase(variant) || colName.contains(variant)) {
                    fieldToColumnIndex.put(entry.getKey(), index);
                    columnMappings.put(colName, entry.getKey());
                    return;
                }
            }
        }

        // Attribute columns
        for (Map.Entry<String, String[]> entry : ATTRIBUTE_MAPPINGS.entrySet()) {
            for (String variant : entry.getValue()) {
                if (colName.equalsIgnoreCase(variant) || colName.contains(variant)) {
                    fieldToColumnIndex.put("attr:" + entry.getKey(), index);
                    columnMappings.put(colName, "attribute:" + entry.getKey());
                    return;
                }
            }
        }

        // Unknown column → becomes attribute
        String normalized = colName.replaceAll("[^a-z0-9_]", "_").replaceAll("_+", "_");
        if (!normalized.isBlank()) {
            fieldToColumnIndex.put("attr:" + normalized, index);
            columnMappings.put(colName, "attribute:" + normalized);
        }
    }

    private void validateMandatoryColumns(Map<String, Integer> fieldToColumnIndex,
            List<ImportValidationErrorDto> errors) {

        // Full Name and Employer are MANDATORY
        if (!fieldToColumnIndex.containsKey("fullName")) {
            errors.add(ImportValidationErrorDto.builder()
                    .rowNumber(0)
                    .field("header")
                    .message("Missing mandatory column: full_name / name (الاسم الكامل)")
                    .build());
        }
        if (!fieldToColumnIndex.containsKey("employer")) {
            errors.add(ImportValidationErrorDto.builder()
                    .rowNumber(0)
                    .field("header")
                    .message("Missing mandatory column: employer / company (جهة العمل)")
                    .build());
        }
    }

    private MemberImportRowDto parseRow(Row row, int rowNum,
            Map<String, Integer> fieldToColumnIndex,
            Map<Integer, String> columnIndexToName,
            List<ImportValidationErrorDto> validationErrors,
            Set<String> seenCardNumbers) {

        List<String> rowErrors = new ArrayList<>(); // Critical errors - block import
        List<String> rowWarnings = new ArrayList<>(); // Warnings - allow import
        Map<String, String> attributes = new HashMap<>();
        String status = "NEW"; // Default status
        boolean hasError = false;
        boolean hasWarning = false;

        // Extract mandatory fields - card_number is the UNIQUE identifier
        String cardNumber = getFieldValue(row, fieldToColumnIndex, "cardNumber");
        String fullName = getFieldValue(row, fieldToColumnIndex, "fullName");
        String employerName = getFieldValue(row, fieldToColumnIndex, "employer");

        // ═══════════════════════════════════════════════════════════════════════════
        // CRITICAL VALIDATIONS (ERROR) - These block import
        // ═══════════════════════════════════════════════════════════════════════════

        // full_name is MANDATORY
        if (fullName == null || fullName.isBlank()) {
            rowErrors.add("الاسم الكامل مطلوب (Full name is required)");
            validationErrors.add(ImportValidationErrorDto.builder()
                    .rowNumber(rowNum)
                    .field("full_name")
                    .message("الاسم الكامل مطلوب - Full name is required")
                    .severity("ERROR")
                    .build());
            hasError = true;
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // NON-CRITICAL VALIDATIONS (WARNING) - These allow import but flag issues
        // ═══════════════════════════════════════════════════════════════════════════

        // employer is MANDATORY (Enterprise Fix)
        if (employerName == null || employerName.isBlank()) {
            rowErrors.add("جهة العمل مطلوبة (Employer is required)");
            validationErrors.add(ImportValidationErrorDto.builder()
                    .rowNumber(rowNum)
                    .field("employer")
                    .message("جهة العمل مطلوبة - Employer is required")
                    .severity("ERROR")
                    .build());
            hasError = true;
        } else {
            // Check if employer exists
            Optional<Employer> employerOpt = employerRepository.findByNameIgnoreCase(employerName);
            if (employerOpt.isEmpty()) {
                List<Employer> matches = employerRepository.findByNameContainingIgnoreCase(employerName);
                if (matches.isEmpty()) {
                    rowWarnings.add(
                            "جهة العمل غير موجودة: " + employerName + " - يرجى التأكد من الاسم أو الكود");
                    validationErrors.add(ImportValidationErrorDto.builder()
                            .rowNumber(rowNum)
                            .field("employer")
                            .value(employerName)
                            .message("جهة العمل غير موجودة - Employer not found: " + employerName)
                            .severity("WARNING")
                            .build());
                    hasWarning = true;
                }
            }
        }

        // Card Number check (Info only, or duplicate check within file?)
        if (cardNumber != null && !cardNumber.isBlank()) {
            if (seenCardNumbers.contains(cardNumber)) {
                rowWarnings.add("رقم بطاقة مكرر في الملف: " + cardNumber + " (سيتم تجاهله وإنشاء رقم جديد)");
            } else {
                seenCardNumbers.add(cardNumber);
            }
        }

        // Extract attributes
        for (Map.Entry<String, Integer> entry : fieldToColumnIndex.entrySet()) {
            if (entry.getKey().startsWith("attr:")) {
                String attrCode = entry.getKey().substring(5);
                String attrValue = getCellStringValue(row.getCell(entry.getValue()));
                if (attrValue != null && !attrValue.isBlank()) {
                    attributes.put(attrCode, attrValue);
                }
            }
        }

        // Determine final status
        if (hasError) {
            status = "ERROR";
        } else if (hasWarning) {
            status = "WARNING"; // Has warnings but can be imported
        }
        // Status will be updated to NEW or UPDATE after checking existence

        return MemberImportRowDto.builder()
                .rowNumber(rowNum)
                .cardNumber(cardNumber)
                .fullName(fullName)
                .employerName(employerName)
                .attributes(attributes)
                .status(status)
                .errors(rowErrors)
                .warnings(rowWarnings)
                .build();
    }

    /**
     * Process a single row for import.
     * 
     * SIMPLIFIED VALIDATION (Phase 2 Enhancement):
     * - Only fullName is truly mandatory
     * - employerOrg and benefitPolicy come from user selection (parameters)
     * - civilId is optional (for matching existing members)
     * - Card Number is auto-generated if not exists
     * - Other fields are imported as available
     * 
     * @param employerOrg Pre-selected employer organization (REQUIRED)
     * @param benefitPolicy Pre-selected benefit policy (OPTIONAL)
     */
    private ImportRowResult processRow(Row row, int rowNum,
            Map<String, Integer> fieldToColumnIndex,
            Map<Integer, String> columnIndexToName,
            MemberImportLog importLog,
            Organization employerOrg,
            BenefitPolicy benefitPolicy) {

        // Extract fields
        String fullName = getFieldValue(row, fieldToColumnIndex, "fullName");
        String civilId = getFieldValue(row, fieldToColumnIndex, "civilId");  // Optional

        // CRITICAL VALIDATION - Only fullName is truly required
        if (fullName == null || fullName.isBlank()) {
            log.debug("⏭️ Skipping row {}: missing full_name", rowNum);
            return ImportRowResult.skipped();
        }

        // Check if member already exists by civilId (if provided)
        Member existingMember = null;
        if (civilId != null && !civilId.isBlank()) {
            existingMember = memberRepository.findByCivilId(civilId).orElse(null);
        }

        Member member;
        boolean isUpdate = false;
        
        if (existingMember != null) {
            // UPDATE existing member
            member = existingMember;
            member.setFullName(fullName);
            isUpdate = true;
            
            log.debug("🔄 Updating existing member: civilId={}, id={}", civilId, member.getId());
            
        } else {
            // CREATE new member
            member = Member.builder()
                    .fullName(fullName)
                    .employerOrganization(employerOrg)      // From user selection
                    .benefitPolicy(benefitPolicy)            // From user selection (optional)
                    .status(MemberStatus.ACTIVE)
                    .cardStatus(Member.CardStatus.ACTIVE)
                    .active(true)
                    .barcode(barcodeGeneratorService.generate()) // RADICAL FIX: Generate Canonical Barcode
                    .build();
            
            log.debug("✨ Creating new member: fullName={}", fullName);
        }

        // Set optional fields (do NOT fail if missing)
        if (civilId != null && !civilId.isBlank()) {
            member.setCivilId(civilId);
        }
        
        // Birth Date
        String birthDateStr = getFieldValue(row, fieldToColumnIndex, "birthDate");
        if (birthDateStr != null && !birthDateStr.isBlank()) {
            try {
                LocalDate birthDate = parseDate(birthDateStr);
                member.setBirthDate(birthDate);
            } catch (Exception e) {
                log.warn("⚠️ Row {}: Invalid birth date '{}': {}", rowNum, birthDateStr, e.getMessage());
            }
        }
        
        // Gender
        String genderStr = getFieldValue(row, fieldToColumnIndex, "gender");
        if (genderStr != null && !genderStr.isBlank()) {
            try {
                Gender gender = parseGender(genderStr);
                member.setGender(gender);
            } catch (Exception e) {
                log.warn("⚠️ Row {}: Invalid gender '{}': {}", rowNum, genderStr, e.getMessage());
            }
        }
        
        // Phone
        String phone = getFieldValue(row, fieldToColumnIndex, "phone");
        if (phone != null && !phone.isBlank()) {
            member.setPhone(phone);
        }
        
        // Email
        String email = getFieldValue(row, fieldToColumnIndex, "email");
        if (email != null && !email.isBlank()) {
            member.setEmail(email);
        }
        
        // Employee Number
        String employeeNumber = getFieldValue(row, fieldToColumnIndex, "employeeNumber");
        if (employeeNumber != null && !employeeNumber.isBlank()) {
            member.setEmployeeNumber(employeeNumber);
        }
        
        // Job Title (as attribute)
        String jobTitle = getFieldValue(row, fieldToColumnIndex, "jobTitle");
        if (jobTitle != null && !jobTitle.isBlank()) {
            // Store as attribute
            MemberAttribute attr = MemberAttribute.builder()
                    .member(member)
                    .attributeCode("job_title")
                    .attributeValue(jobTitle)
                    .source(AttributeSource.IMPORT)
                    .build();
            member.getAttributes().add(attr);
        }
        
        // Department (as attribute)
        String department = getFieldValue(row, fieldToColumnIndex, "department");
        if (department != null && !department.isBlank()) {
            MemberAttribute attr = MemberAttribute.builder()
                    .member(member)
                    .attributeCode("department")
                    .attributeValue(department)
                    .source(AttributeSource.IMPORT)
                    .build();
            member.getAttributes().add(attr);
        }

        // Save member (Card Number will be auto-generated via @PrePersist if null)
        member = memberRepository.save(member);
        
        log.info("✅ Row {}: {} member: id={}, name={}, cardNumber={}", 
                rowNum, 
                isUpdate ? "Updated" : "Created",
                member.getId(), 
                member.getFullName(),
                member.getCardNumber());

        return isUpdate ? ImportRowResult.updated() : ImportRowResult.created();
    }

    private void saveOrUpdateAttribute(Member member, String code, String value, AttributeSource source) {
        Optional<MemberAttribute> existing = attributeRepository
                .findByMemberIdAndAttributeCode(member.getId(), code);

        MemberAttribute attr;
        if (existing.isPresent()) {
            attr = existing.get();
            attr.setAttributeValue(value);
            attr.setSource(source);
        } else {
            attr = MemberAttribute.builder()
                    .member(member)
                    .attributeCode(code)
                    .attributeValue(value)
                    .source(source)
                    .build();
        }
        attributeRepository.save(attr);
    }

    private String getFieldValue(Row row, Map<String, Integer> fieldToColumnIndex, String field) {
        Integer colIndex = fieldToColumnIndex.get(field);
        if (colIndex == null)
            return null;
        return getCellStringValue(row.getCell(colIndex));
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null)
            return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                yield String.valueOf((long) cell.getNumericCellValue());
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            default -> null;
        };
    }

    private boolean isEmptyRow(Row row) {
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellStringValue(cell);
                if (value != null && !value.isBlank()) {
                    return false;
                }
            }
        }
        return true;
    }

    private Gender parseGender(String value) {
        if (value == null || value.isBlank())
            return Gender.UNDEFINED; // Default to UNDEFINED if empty
        String v = value.toLowerCase().trim();
        if (v.contains("male") || v.contains("ذكر") || v.equals("m")) {
            return Gender.MALE;
        }
        if (v.contains("female") || v.contains("أنثى") || v.equals("f")) {
            return Gender.FEMALE;
        }
        if (v.contains("undefined") || v.contains("غير محدد") || v.equals("u")) {
            return Gender.UNDEFINED;
        }
        // Default to UNDEFINED for any unrecognized value
        return Gender.UNDEFINED;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank())
            return null;
        try {
            // Try ISO format
            return LocalDate.parse(value);
        } catch (Exception e1) {
            try {
                // Try dd/MM/yyyy
                String[] parts = value.split("[/\\-]");
                if (parts.length == 3) {
                    int day = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    if (year < 100)
                        year += 2000;
                    return LocalDate.of(year, month, day);
                }
            } catch (Exception e2) {
                log.warn("Could not parse date: {}", value);
            }
        }
        return null;
    }

    private String rowToJson(Row row, Map<Integer, String> columnIndexToName) {
        Map<String, String> data = new HashMap<>();
        for (Map.Entry<Integer, String> entry : columnIndexToName.entrySet()) {
            String value = getCellStringValue(row.getCell(entry.getKey()));
            if (value != null) {
                data.put(entry.getValue(), value);
            }
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    /**
     * Result of processing a single row
     */
    private static class ImportRowResult {
        private final boolean created;
        private final boolean updated;
        private final boolean skipped;

        private ImportRowResult(boolean created, boolean updated, boolean skipped) {
            this.created = created;
            this.updated = updated;
            this.skipped = skipped;
        }

        static ImportRowResult created() {
            return new ImportRowResult(true, false, false);
        }

        static ImportRowResult updated() {
            return new ImportRowResult(false, true, false);
        }

        static ImportRowResult skipped() {
            return new ImportRowResult(false, false, true);
        }

        boolean isCreated() {
            return created;
        }

        boolean isUpdated() {
            return updated;
        }

        boolean isSkipped() {
            return skipped;
        }
    }
}
