package com.waad.tba.security;

/**
 * Complete enumeration of all system permissions.
 * These are used to control access at the granular level.
 * Roles are assigned a set of these permissions.
 * 
 * Permission Naming Convention: {VERB}_{RESOURCE}
 * Example: MANAGE_MEMBERS, VIEW_REPORTS, APPROVE_CLAIMS
 * 
 * @author TBA WAAD System
 * @version 2.0 (Clean RBAC Foundation)
 */
public enum AppPermission {
    
    // ============================================
    // RBAC Management (Super Admin Only)
    // ============================================
    MANAGE_RBAC("إدارة الأدوار والصلاحيات", "Full control over roles, permissions, and user assignments"),
    
    // ============================================
    // System Administration (Super Admin Only)
    // ============================================
    MANAGE_SYSTEM_SETTINGS("إدارة إعدادات النظام", "Configure system-wide settings and parameters"),
    
    // ============================================
    // Company Management
    // ============================================
    MANAGE_COMPANIES("إدارة الشركات", "Create, update, delete, and view all companies in the system"),
    VIEW_COMPANIES("عرض الشركات", "View company information"),
    
    // ============================================
    // Insurance Company Management
    // ============================================
    MANAGE_INSURANCE("إدارة شركات التأمين", "Full management of insurance companies"),
    VIEW_INSURANCE("عرض شركات التأمين", "View insurance company information"),
    
    // ============================================
    // Reviewer Company Management
    // ============================================
    MANAGE_REVIEWER("إدارة شركات المراجعة الطبية", "Full management of medical reviewer companies"),
    VIEW_REVIEWER("عرض شركات المراجعة", "View reviewer company information"),
    
    // ============================================
    // Provider Management
    // ============================================
    MANAGE_PROVIDERS("إدارة مقدمي الخدمة", "Full management of healthcare providers"),
    VIEW_PROVIDERS("عرض مقدمي الخدمة", "View provider information"),
    
    // ============================================
    // Provider Contracts Management
    // ============================================
    MANAGE_PROVIDER_CONTRACTS("إدارة عقود مقدمي الخدمة", "Full management of provider contracts (create, update, delete, pricing)"),
    VIEW_PROVIDER_CONTRACTS("عرض عقود مقدمي الخدمة", "View provider contract information and statistics"),
    
    // ============================================
    // Employer Management
    // ============================================
    MANAGE_EMPLOYERS("إدارة أصحاب العمل", "Full management of employer companies"),
    VIEW_EMPLOYERS("عرض أصحاب العمل", "View employer information"),
    
    // ============================================
    // Member Management
    // ============================================
    MANAGE_MEMBERS("إدارة الأعضاء", "Create, update, delete, and view members"),
    VIEW_MEMBERS("عرض الأعضاء", "View member information only"),
    
    // ============================================
    // Settlement Management
    // ============================================
    MANAGE_SETTLEMENTS("إدارة التسويات", "Full management of financial settlements"),
    VIEW_SETTLEMENTS("عرض التسويات", "View settlement batches and provider accounts"),
    CREATE_SETTLEMENT_BATCH("إنشاء دفعة تسوية", "Create new settlement batches"),
    CONFIRM_SETTLEMENT_BATCH("تأكيد دفعة تسوية", "Confirm settlement batches for payment"),
    PAY_SETTLEMENT_BATCH("دفع دفعة تسوية", "Mark settlement batches as paid"),
    CANCEL_SETTLEMENT_BATCH("إلغاء دفعة تسوية", "Cancel settlement batches"),

    // ============================================
    // Claims Management
    // ============================================
    MANAGE_CLAIMS("إدارة المطالبات", "Full management of claims (create, update, delete)"),
    VIEW_CLAIMS("عرض المطالبات", "View claim information"),
    CREATE_CLAIM("إنشاء مطالبة", "Submit new claims to the system"),
    UPDATE_CLAIM("تحديث مطالبة", "Update existing claim information"),
    APPROVE_CLAIMS("الموافقة على المطالبات", "Approve claims for payment"),
    REJECT_CLAIMS("رفض المطالبات", "Reject claims with reasons"),
    VIEW_CLAIM_STATUS("عرض حالة المطالبة", "View current status of submitted claims"),
    
    // ============================================
    // Visit Management
    // ============================================
    MANAGE_VISITS("إدارة الزيارات", "Full management of medical visits"),
    VIEW_VISITS("عرض الزيارات", "View visit information"),
    
    // ============================================
    // Pre-Authorization Management
    // ============================================
    MANAGE_PREAUTH("إدارة الموافقات المسبقة", "Full management of pre-authorizations"),
    VIEW_PREAUTH("عرض الموافقات المسبقة", "View pre-authorization information"),
    // Granular Pre-Authorization Permissions (for controller-level security)
    VIEW_PRE_AUTH("عرض طلبات الموافقة المسبقة", "View pre-authorization requests"),
    CREATE_PRE_AUTH("إنشاء طلب موافقة مسبقة", "Create pre-authorization requests"),
    UPDATE_PRE_AUTH("تحديث طلب موافقة مسبقة", "Update pre-authorization requests"),
    APPROVE_PRE_AUTH("الموافقة على طلب مسبق", "Approve pre-authorization requests"),
    REJECT_PRE_AUTH("رفض طلب مسبق", "Reject pre-authorization requests"),
    CANCEL_PRE_AUTH("إلغاء طلب مسبق", "Cancel pre-authorization requests"),
    DELETE_PRE_AUTH("حذف طلب مسبق", "Delete pre-authorization requests"),
    
    // ============================================
    // Reports and Analytics
    // ============================================
    MANAGE_REPORTS("إدارة التقارير", "Create, customize, and manage report templates"),
    VIEW_REPORTS("عرض التقارير", "View system reports and analytics"),
    
    // ============================================
    // Basic Data Access (Minimal Permission)
    // ============================================
    VIEW_BASIC_DATA("عرض البيانات الأساسية", "View basic system information (read-only access)");

    // ============================================
    // Enum Properties
    // ============================================
    
    private final String displayNameAr;
    private final String description;

    AppPermission(String displayNameAr, String description) {
        this.displayNameAr = displayNameAr;
        this.description = description;
    }

    /**
     * Get the permission name (enum name itself).
     * This is used in @PreAuthorize annotations.
     * Example: "MANAGE_MEMBERS"
     */
    public String getPermissionName() {
        return this.name();
    }

    /**
     * Get the Arabic display name for UI.
     */
    public String getDisplayNameAr() {
        return displayNameAr;
    }

    /**
     * Get the English description.
     */
    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return getPermissionName();
    }

    /**
     * Get all permission names as a String array
     */
    public static String[] getAllPermissionNames() {
        AppPermission[] values = values();
        String[] names = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            names[i] = values[i].name();
        }
        return names;
    }
}
