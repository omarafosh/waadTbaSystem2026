package com.waad.tba.modules.claim.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.waad.tba.common.dto.ApiResponse;
import com.waad.tba.modules.claim.dto.AdjudicationReportDto;
import com.waad.tba.modules.claim.dto.ClaimFinancialSummaryDto;
import com.waad.tba.modules.claim.entity.ClaimStatus;
import com.waad.tba.modules.claim.service.AdjudicationReportService;
import com.waad.tba.modules.claim.service.ClaimFinancialSummaryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Reports Controller - Adjudication & Settlement Reports.
 * 
 * تقارير التدقيق المالي والتسويات.
 * 
 * القاعدة: المطلوب = تحمل المريض + المستحق للمستشفى
 * RequestedAmount = PatientCoPay + NetProviderAmount
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Financial Reports - Adjudication & Settlement")
public class ReportsController {
    
    private final AdjudicationReportService adjudicationReportService;
    private final ClaimFinancialSummaryService claimFinancialSummaryService;
    
    /**
     * Generate Adjudication Report.
     * 
     * تقرير التدقيق المالي:
     * - المبالغ المطلوبة من كل مقدم خدمة
     * - المبالغ المستقطعة (تحمل المريض)
     * - المبالغ المستحقة للدفع
     */
    @GetMapping("/adjudication")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('VIEW_REPORTS')")
    @Operation(
        summary = "تقرير التدقيق المالي",
        description = "يُظهر: المطلوب | المستقطع (تحمل المريض) | المستحق للمستشفى"
    )
    public ResponseEntity<ApiResponse<AdjudicationReportDto>> getAdjudicationReport(
            @Parameter(description = "تاريخ البداية (YYYY-MM-DD)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            
            @Parameter(description = "تاريخ النهاية (YYYY-MM-DD)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            
            @Parameter(description = "فلترة حسب مقدم الخدمة")
            @RequestParam(required = false) String providerName,
            
            @Parameter(description = "فلترة حسب حالة المطالبة")
            @RequestParam(required = false) List<ClaimStatus> statuses) {
        
        AdjudicationReportDto report = adjudicationReportService.generateReport(
            fromDate, toDate, providerName, statuses);
        
        return ResponseEntity.ok(ApiResponse.success("تم إنشاء تقرير التدقيق المالي", report));
    }
    
    /**
     * Generate Provider Settlement Report.
     * 
     * تقرير التسوية لمقدم خدمة معين:
     * - المطالبات الموافق عليها والجاهزة للدفع
     */
    @GetMapping("/provider-settlement")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('VIEW_REPORTS')")
    @Operation(
        summary = "تقرير تسوية مقدم الخدمة",
        description = "المطالبات الموافق عليها والجاهزة للتسوية"
    )
    public ResponseEntity<ApiResponse<AdjudicationReportDto>> getProviderSettlementReport(
            @Parameter(description = "اسم مقدم الخدمة")
            @RequestParam(required = false) String providerName) {
        
        AdjudicationReportDto report = adjudicationReportService.generateProviderSettlementReport(providerName);
        return ResponseEntity.ok(ApiResponse.success("تم إنشاء تقرير التسوية", report));
    }
    
    /**
     * Generate Member Statement.
     * 
     * كشف حساب العضو:
     * - جميع المطالبات للعضو
     * - إجمالي المدفوعات والتحملات
     */
    @GetMapping("/member-statement/{memberId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('VIEW_REPORTS')")
    @Operation(
        summary = "كشف حساب العضو",
        description = "جميع مطالبات العضو مع الإجماليات"
    )
    public ResponseEntity<ApiResponse<AdjudicationReportDto>> getMemberStatement(
            @PathVariable Long memberId,
            
            @Parameter(description = "تاريخ البداية (اختياري)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            
            @Parameter(description = "تاريخ النهاية (اختياري)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        
        // Default to current year if dates not specified
        if (fromDate == null) {
            fromDate = LocalDate.now().withDayOfYear(1);
        }
        if (toDate == null) {
            toDate = LocalDate.now();
        }
        
        AdjudicationReportDto report = adjudicationReportService.generateMemberStatement(
            memberId, fromDate, toDate);
        
        return ResponseEntity.ok(ApiResponse.success("تم إنشاء كشف حساب العضو", report));
    }
    
    /**
     * Get Summary Statistics for Dashboard.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('VIEW_REPORTS')")
    @Operation(
        summary = "ملخص الإحصائيات",
        description = "إحصائيات سريعة للوحة التحكم"
    )
    public ResponseEntity<ApiResponse<AdjudicationReportDto>> getSummary() {
        // Current month
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        
        AdjudicationReportDto report = adjudicationReportService.generateReport(
            monthStart, today, null, null);
        
        return ResponseEntity.ok(ApiResponse.success("ملخص الشهر الحالي", report));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // FINANCIAL SUMMARY ENDPOINTS - SINGLE SOURCE OF TRUTH
    // ═══════════════════════════════════════════════════════════════════════════════
    // These endpoints provide authoritative financial totals from database.
    // Frontend MUST use these - NO client-side .reduce() calculations allowed.
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Get comprehensive financial summary - AUTHORITATIVE totals.
     * 
     * تقرير مالي شامل:
     * - الإجماليات محسوبة من قاعدة البيانات مباشرة
     * - يمنع الواجهة من حساب المبالغ محلياً
     */
    @GetMapping("/financial-summary")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('VIEW_REPORTS')")
    @Operation(
        summary = "الملخص المالي الشامل",
        description = "إجماليات مالية محسوبة من قاعدة البيانات - المصدر الوحيد للحقيقة"
    )
    public ResponseEntity<ApiResponse<ClaimFinancialSummaryDto>> getFinancialSummary(
            @Parameter(description = "فلتر حسب جهة العمل (اختياري)")
            @RequestParam(required = false) Long employerOrgId,
            
            @Parameter(description = "تاريخ البداية (اختياري)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            
            @Parameter(description = "تاريخ النهاية (اختياري)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        
        ClaimFinancialSummaryDto summary = claimFinancialSummaryService.getFinancialSummary(
            employerOrgId, fromDate, toDate);
        
        return ResponseEntity.ok(ApiResponse.success("تم استرجاع الملخص المالي", summary));
    }
    
    /**
     * Get settlement-focused summary for Settlement Inbox.
     * 
     * ملخص التسويات:
     * - المطالبات الموافق عليها والجاهزة للتسوية
     * - المبالغ المعلقة للدفع
     */
    @GetMapping("/settlement-summary")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('VIEW_REPORTS') or hasAuthority('CLAIM_WRITE')")
    @Operation(
        summary = "ملخص التسويات",
        description = "إجماليات للمطالبات الموافق عليها والمسددة"
    )
    public ResponseEntity<ApiResponse<ClaimFinancialSummaryDto>> getSettlementSummary(
            @Parameter(description = "فلتر حسب جهة العمل (اختياري)")
            @RequestParam(required = false) Long employerOrgId) {
        
        ClaimFinancialSummaryDto summary = claimFinancialSummaryService.getSettlementSummary(employerOrgId);
        
        return ResponseEntity.ok(ApiResponse.success("تم استرجاع ملخص التسويات", summary));
    }
}
