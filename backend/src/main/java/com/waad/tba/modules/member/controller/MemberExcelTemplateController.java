package com.waad.tba.modules.member.controller;

import com.waad.tba.common.dto.ApiResponse;
import com.waad.tba.common.excel.dto.ExcelImportResult;
import com.waad.tba.modules.member.service.MemberExcelTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Controller for Members Excel template download and import
 * 
 * NEW ARCHITECTURE:
 * - System-generated templates only
 * - Create-only imports (Phase 1)
 * - Strict validation with detailed error reporting
 */
@Slf4j
@RestController
@RequestMapping("/api/unified-members/import")
@RequiredArgsConstructor
@Tag(name = "Member Excel Import", description = "System-generated Excel template download and import")
public class MemberExcelTemplateController {
    
    private final MemberExcelTemplateService templateService;
    
    /**
     * Download Excel template for members import
     * 
     * GET /api/members/import/template
     */
    @GetMapping("/template")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('members.import')")
    @Operation(
        summary = "Download Members Import Template",
        description = "Downloads a system-generated Excel template for importing members. " +
                     "Only files downloaded from this endpoint are accepted for import."
    )
    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        log.info("[MemberImport] Template download requested");
        
        byte[] excelData = templateService.generateTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "Members_Import_Template.xlsx");
        headers.setContentLength(excelData.length);
        
        log.info("[MemberImport] Template generated: {} bytes", excelData.length);
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(excelData);
    }
    
    /**
     * Import members from Excel file
     * 
     * POST /api/members/import
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('members.import')")
    @Operation(
        summary = "Import Members from Excel",
        description = "Imports members from a system-generated Excel template. " +
                     "Only creates new members (no updates in Phase 1). " +
                     "Card numbers are auto-generated. Employer lookup is mandatory."
    )
    public ResponseEntity<ApiResponse<ExcelImportResult>> importMembers(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("[MemberImport] Import requested: {}", file.getOriginalFilename());
        
        ExcelImportResult result = templateService.importFromExcel(file);
        
        log.info("[MemberImport] Import completed - Created: {}, Rejected: {}, Failed: {}",
            result.getSummary().getCreated(),
            result.getSummary().getRejected(),
            result.getSummary().getFailed());
        
        if (result.isSuccess()) {
            return ResponseEntity.ok(ApiResponse.success(result.getMessageEn(), result));
        } else {
            // FIX: Return 200 OK even for validation errors so frontend can display the error report
            return ResponseEntity.ok()
                .body(ApiResponse.<ExcelImportResult>builder()
                    .status("error")
                    .message(result.getMessageEn())
                    .data(result)
                    .timestamp(java.time.LocalDateTime.now())
                    .build());
        }
    }
}
