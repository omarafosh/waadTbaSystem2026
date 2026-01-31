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
import org.springframework.transaction.annotation.Propagation;
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
import com.waad.tba.modules.member.dto.MemberCreateDto;
import com.waad.tba.modules.member.dto.MemberViewDto;
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
import com.waad.tba.common.enums.OrganizationType;
import com.waad.tba.common.repository.OrganizationRepository;
import com.waad.tba.common.entity.Organization;
import com.waad.tba.modules.rbac.entity.User;
import com.waad.tba.security.AuthorizationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.waad.tba.modules.member.service.BarcodeGeneratorService;
import com.waad.tba.modules.member.service.UnifiedMemberService;

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
    private final BarcodeGeneratorService barcodeGeneratorService;
    private final com.waad.tba.common.excel.service.ExcelParserService parserService;
    private final UnifiedMemberService unifiedMemberService;

    // Self-injection for Propagation.REQUIRES_NEW visibility
    private MemberExcelImportService self;

    @org.springframework.beans.factory.annotation.Autowired
    public void setSelf(@org.springframework.context.annotation.Lazy MemberExcelImportService self) {
        this.self = self;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN MAPPINGS (Odoo Compatible + Enhanced Arabic Support)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Mandatory columns (at least one variant required)
     */
    private static final List<String[]> MANDATORY_COLUMNS = List.of(
            // Full Name - الاسم الكامل (MANDATORY)
            new String[] {
                    "full_name", "name", "fullname", "member_name",
                    "الاسم الكامل", "الاسم", "اسم الموظف", "اسم العضو",
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
            // National Number - الرقم الوطني
            Map.entry("nationalNumber", new String[] {
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
     * Parse Excel file and return preview without importing (with default
     * mappings).
     */
    public MemberImportPreviewDto parseAndPreview(MultipartFile file) throws Exception {
        return parseAndPreview(file, (String) null, 0);
    }

    /**
     * Parse Excel file and return preview using Map for custom mappings (Backward
     * compatibility).
     */
    public MemberImportPreviewDto parseAndPreview(MultipartFile file, Map<String, String> customMappings)
            throws Exception {
        String json = null;
        if (customMappings != null) {
            json = objectMapper.writeValueAsString(customMappings);
        }
        return parseAndPreview(file, json, 0);
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
     * @param file           Excel file
     * @param customMappings Optional map of Excel column names to system field
     *                       names
     */
    @Transactional(readOnly = true)
    public MemberImportPreviewDto parseAndPreview(MultipartFile file, String customMappingsJson, Integer headerRowNumber)
            throws Exception {
        log.info("📊 Parsing Excel file for preview: {} (headerRow: {}, has custom mappings: {})",
                file.getOriginalFilename(), headerRowNumber, (customMappingsJson != null && !customMappingsJson.isBlank()));

        int hRow = headerRowNumber != null ? headerRowNumber : 0;
        String batchId = UUID.randomUUID().toString();
        List<MemberImportRowDto> previewRows = new ArrayList<>();
        List<ImportValidationErrorDto> validationErrors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Map<String, String> columnMappings = new LinkedHashMap<>();
        List<String> detectedColumns = new ArrayList<>();

        // Parse custom mappings if provided
        Map<String, String> customMappings = null;
        if (customMappingsJson != null && !customMappingsJson.isBlank()) {
            try {
                customMappings = objectMapper.readValue(customMappingsJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse custom mappings JSON: {}", customMappingsJson);
            }
        }

        int newCount = 0;
        int updateCount = 0;
        int warningCount = 0;
        int errorCount = 0;

        try (Workbook workbook = parserService.openWorkbook(file)) {

            Sheet sheet = parserService.getDataSheet(workbook);
            int totalRows = sheet.getLastRowNum();

            // Parse header row
            Row headerRow = sheet.getRow(hRow);
            if (headerRow == null) {
                throw new BusinessRuleException("Excel file has no header row at row " + hRow);
            }

            Map<Integer, String> columnIndexToName = new HashMap<>();
            Map<String, Integer> fieldToColumnIndex = new HashMap<>();

            // Build column index map first
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String colName = parserService.getCellValueAsString(cell);
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

                    // Find column index using parserService logic
                    Integer columnIndex = parserService.findColumnIndex(headerRow, excelColumn);
                    if (columnIndex != null) {
                        fieldToColumnIndex.put(systemField, columnIndex);
                        columnMappings.put(excelColumn, systemField);
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

            for (int rowNum = hRow + 1; rowNum <= totalRows; rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null || parserService.isEmptyRow(row))
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

            // NEW: Load available employers for selection (Organization Canonical Model)
            List<Organization> allEmployers = organizationRepository.findByTypeAndActiveTrueAndArchivedFalse(OrganizationType.EMPLOYER);
            List<MemberImportPreviewDto.EmployerOptionDto> employerOptions = allEmployers.stream()
                    .map(e -> MemberImportPreviewDto.EmployerOptionDto.builder()
                            .id(e.getId())
                            .code(e.getCode())
                            .nameAr(e.getName()) // Using unified name field
                            .active(e.isActive())
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
                            .employerId(
                                    p.getEmployerOrganization() != null ? p.getEmployerOrganization().getId() : null)
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
                    .availableEmployers(employerOptions) // NEW
                    .availableBenefitPolicies(policyOptions) // NEW
                    .build();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPORT (Commit after confirmation)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Execute import without header row number (Backward compatibility).
     */
    @Transactional
    public MemberImportResultDto executeImport(
            MultipartFile file,
            String batchId,
            Long employerId,
            Long benefitPolicyId) throws Exception {
        return executeImport(file, batchId, employerId, benefitPolicyId, 0);
    }

    /**
     * Execute import after user confirmation.
     * 
     * @param file            Excel file
     * @param batchId         Batch ID from preview
     * @param employerId      Selected employer ID (REQUIRED)
     * @param benefitPolicyId Selected benefit policy ID (OPTIONAL)
     */
    @Transactional
    public MemberImportResultDto executeImport(
            MultipartFile file,
            String batchId,
            Long employerId,
            Long benefitPolicyId,
            Integer headerRowNumber) throws Exception {

        log.info("📥 Executing member import: batchId={}, headerRow={}, file={}, employer={}, policy={}",
                batchId, headerRowNumber, file.getOriginalFilename(), employerId, benefitPolicyId);

        int hRow = headerRowNumber != null ? headerRowNumber : 0;

        // ENSURE SEQUENCES EXIST (Real-time Fail-safe)
        try {
            barcodeGeneratorService.ensureSequencesExist();
        } catch (Exception e) {
            log.warn("Non-critical: Self-healing check failed: {}", e.getMessage());
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("الملف المرفق فارغ");
        }

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

        // RADICAL FIX: Create log in a separate transaction so it's visible to error logging transactions
        MemberImportLog importLog = self.createImportLog(batchId, file.getOriginalFilename(), file.getSize(), currentUser);

        List<ImportErrorDetailDto> errors = new ArrayList<>();
        int totalProcessed = 0;
        int createdCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;

        try (Workbook workbook = parserService.openWorkbook(file)) {

            Sheet sheet = parserService.getDataSheet(workbook);
            int totalRows = sheet.getLastRowNum();
            importLog.setTotalRows(totalRows - hRow);

            // Parse header
            Row headerRow = sheet.getRow(hRow);
            Map<Integer, String> columnIndexToName = new HashMap<>();
            Map<String, Integer> fieldToColumnIndex = new HashMap<>();
            Map<String, String> columnMappings = new LinkedHashMap<>();

            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                String colName = parserService.getCellValueAsString(headerRow.getCell(i));
                if (colName == null) colName = "";
                colName = colName.trim().toLowerCase();
                columnIndexToName.put(i, colName);
                mapColumnToField(colName, i, fieldToColumnIndex, columnMappings);
            }

            // Process rows
            for (int rowNum = hRow + 1; rowNum <= totalRows; rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null || parserService.isEmptyRow(row)) {
                    skippedCount++;
                    continue;
                }

                totalProcessed++;

                try {
                    // RADICAL FIX: Process each row in its own transaction. Pass IDs instead of Entities
                    // to ensure they are correctly attached to the NEW transaction persistence context.
                    ImportRowResult result = self.processRow(row, rowNum, fieldToColumnIndex,
                            columnIndexToName, importLog.getId(), employerId, benefitPolicyId);

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
                    String errorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
                    log.error("❌ Row {} failed: {}", rowNum, errorMsg);
                    
                    // RADICAL FIX: Use self-invocation with REQUIRES_NEW to save error even if main transaction is aborted
                    self.saveImportError(importLog.getId(), rowNum, errorMsg, rowJson);

                    errors.add(MemberImportResultDto.ImportErrorDetailDto.builder()
                            .rowNumber(rowNum)
                            .errorType("SYSTEM")
                            .message(errorMsg)
                            .messageAr(errorMsg) // For Frontend
                            .messageEn(errorMsg) // For Frontend
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

            // Populate Summary for Frontend
            MemberImportResultDto.ImportSummary summary = MemberImportResultDto.ImportSummary.builder()
                    .total(totalProcessed)
                    .created(createdCount)
                    .updated(updatedCount)
                    .failed(errorCount)
                    .build();

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
                    .summary(summary) // NEW
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
        String nationalNumber = getFieldValue(row, fieldToColumnIndex, "nationalNumber");

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
            // Check if employer exists (Using Organization Canonical Model)
            List<Organization> matches = organizationRepository.searchByType(employerName, OrganizationType.EMPLOYER);
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
                String attrValue = parserService.getCellValueAsString(row.getCell(entry.getValue()));
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
                .nationalNumber(nationalNumber)
                .employerName(employerName)
                .attributes(attributes)
                .status(status)
                .errors(rowErrors)
                .warnings(rowWarnings)
                .build();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ImportRowResult processRow(Row row, int rowNum,
            Map<String, Integer> fieldToColumnIndex,
            Map<Integer, String> columnIndexToName,
            Long importLogId,
            Long employerId,
            Long benefitPolicyId) {

        MemberImportLog importLog = importLogRepository.findById(importLogId).orElse(null);
        Organization employerOrg = organizationRepository.findById(employerId).orElse(null);
        BenefitPolicy benefitPolicy = benefitPolicyId != null ? benefitPolicyRepository.findById(benefitPolicyId).orElse(null) : null;

        if (importLog == null || employerOrg == null) {
            throw new RuntimeException("Missing required context for row processing (Log or Employer)");
        }

        // Extract fields
        String fullName = getFieldValue(row, fieldToColumnIndex, "fullName");
        String nationalNumber = getFieldValue(row, fieldToColumnIndex, "nationalNumber"); // Fixed: matching preview DTO

        // CRITICAL VALIDATION - Only fullName is truly required
        if (fullName == null || fullName.isBlank()) {
            log.debug("⏭️ Skipping row {}: missing full_name", rowNum);
            return ImportRowResult.skipped();
        }

        // Check if member already exists (SMART DETECTION)
        Member existingMember = null;
        
        // 1. Try by nationalNumber (Highest priority)
        if (nationalNumber != null && !nationalNumber.isBlank()) {
            List<Member> byNationalNumber = memberRepository.findByNationalNumber(nationalNumber);
            if (byNationalNumber.isEmpty()) {
                byNationalNumber = memberRepository.findByCivilId(nationalNumber);
            }
            existingMember = byNationalNumber.isEmpty() ? null : byNationalNumber.get(0);
        }

        // 2. Try by Name + BirthDate + Employer (Fallback for accurate matching without ID)
        if (existingMember == null && fullName != null && !fullName.isBlank()) {
            String birthDateStr = getFieldValue(row, fieldToColumnIndex, "birthDate");
            if (birthDateStr != null && !birthDateStr.isBlank()) {
                try {
                    LocalDate birthDate = parseDate(birthDateStr);
                    if (birthDate != null) {
                        List<Member> byNameAndBirthDetail = memberRepository.findByFullNameAndBirthDateAndEmployerOrganizationId(
                                fullName, birthDate, employerOrg.getId());
                        existingMember = byNameAndBirthDetail.isEmpty() ? null : byNameAndBirthDetail.get(0);
                    }
                } catch (Exception e) {
                    // Ignore parse error here, will be handled during member population
                }
            }
        }

        Member member;
        boolean isUpdate = false;

        if (existingMember != null) {
            // UPDATE existing member
            member = existingMember;
            member.setFullName(fullName);
            isUpdate = true;

            log.debug("🔄 Updating existing member: nationalNumber={}, id={}", nationalNumber, member.getId());

        } else {
            // CREATE new member using UNIFIED SERVICE to ensure correct card numbering/barcode
            MemberCreateDto createDto = MemberCreateDto.builder()
                    .fullName(fullName)
                    .employerId(employerOrg.getId())
                    .benefitPolicyId(benefitPolicyId)
                    .status(MemberStatus.ACTIVE)
                    .cardStatus(Member.CardStatus.ACTIVE)
                    .active(true)
                    .employeeNumber(getFieldValue(row, fieldToColumnIndex, "employeeNumber"))
                    .nationalNumber(nationalNumber)
                    .phone(getFieldValue(row, fieldToColumnIndex, "phone"))
                    .email(getFieldValue(row, fieldToColumnIndex, "email"))
                    .build();

            MemberViewDto created = unifiedMemberService.createPrincipalMember(createDto);
            member = memberRepository.findById(created.getId())
                    .orElseThrow(() -> new RuntimeException("Failed to reload created member"));
            
            log.info("✨ Created NEW member via Unified Service: id={}, cardNumber={}, barcode={}", 
                     member.getId(), member.getCardNumber(), member.getBarcode());
        }

        // Set/Update fields not covered by basic create or for updates
        if (isUpdate) {
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
            // National Number
            if (nationalNumber != null && !nationalNumber.isBlank()) {
                member.setNationalNumber(nationalNumber);
            }
            // Employee Number
            String employeeNumber = getFieldValue(row, fieldToColumnIndex, "employeeNumber");
            if (employeeNumber != null && !employeeNumber.isBlank()) {
                member.setEmployeeNumber(employeeNumber);
            }
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
        try {
            member = memberRepository.save(member);
        } catch (Exception e) {
            log.error("❌ Error saving member in row {}: {}", rowNum, e.getMessage());
            throw e;
        }

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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public MemberImportLog createImportLog(String batchId, String fileName, long fileSize, User currentUser) {
        MemberImportLog importLog = MemberImportLog.builder()
                .importBatchId(batchId)
                .fileName(fileName)
                .fileSizeBytes(fileSize)
                .status(ImportStatus.PROCESSING)
                .importedByUserId(currentUser != null ? currentUser.getId() : null)
                .importedByUsername(currentUser != null ? currentUser.getUsername() : "system")
                .build();
        importLog.markStarted();
        return importLogRepository.save(importLog);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveImportError(Long logId, int rowNum, String message, String rowData) {
        try {
            MemberImportLog log = importLogRepository.findById(logId).orElse(null);
            if (log != null) {
                MemberImportError error = MemberImportError.systemError(log, rowNum, message, rowData);
                importErrorRepository.save(error);
            }
        } catch (Exception e) {
            // Last resort: log to console if even this fails
            log.error("❌ Failed to save import error to database: {}", e.getMessage());
        }
    }

    private String getFieldValue(Row row, Map<String, Integer> fieldToColumnIndex, String field) {
        Integer colIndex = fieldToColumnIndex.get(field);
        if (colIndex == null)
            return null;
        return parserService.getCellValueAsString(row.getCell(colIndex));
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
            String value = parserService.getCellValueAsString(row.getCell(entry.getKey()));
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
