package com.waad.tba.security;

/**
 * Complete enumeration of all system permissions.
 * These are used to control access at the granular level.
 * Roles are assigned a set of these permissions.
 * 
 * Permission Naming Convention: {VERB}_{RESOURCE}
 * Verb: VIEW, CREATE, UPDATE, DELETE, PRINT, EXPORT, APPROVE, REJECT
 * Resource: MEMBERS, CLAIMS, etc.
 * 
 * @author TBA WAAD System
 * @version 3.0 (Granular Permissions)
 */
public enum AppPermission {
    
    // ============================================
    // RBAC Management
    // ============================================
    MANAGE_RBAC("إدارة الأدوار والصلاحيات", "Full system control"), // Keep for Super Admin protection
    
    // Users
    VIEW_USERS("عرض المستخدمين", "View system users list"),
    CREATE_USER("إضافة مستخدم", "Create new system user"),
    UPDATE_USER("تعديل مستخدم", "Update existing user"),
    DELETE_USER("حذف مستخدم", "Delete system user"),
    PRINT_USERS("طباعة المستخدمين", "Print users list"),
    EXPORT_USERS("تصدير المستخدمين", "Export users data"),
    MANAGE_USERS("إدارة المستخدمين", "Legacy: Full user management"),

    // Roles
    VIEW_ROLES("عرض الأدوار", "View system roles"),
    CREATE_ROLE("إضافة دور", "Create new role"),
    UPDATE_ROLE("تعديل دور", "Update existing role"),
    DELETE_ROLE("حذف دور", "Delete role"),
    PRINT_ROLES("طباعة الأدوار", "Print roles list"),
    EXPORT_ROLES("تصدير الأدوار", "Export roles data"),
    ASSIGN_ROLES("تعيين الأدوار", "Assign roles to users"),
    ASSIGN_PERMISSIONS("تعيين الصلاحيات", "Assign permissions to roles"),
    MANAGE_ROLES("إدارة الأدوار", "Legacy: Full role management"),

    // Permissions
    VIEW_PERMISSIONS("عرض الصلاحيات", "View available permissions"),
    PRINT_PERMISSIONS("طباعة الصلاحيات", "Print permissions list"),
    EXPORT_PERMISSIONS("تصدير الصلاحيات", "Export permissions data"),
    MANAGE_PERMISSIONS("إدارة الصلاحيات", "Legacy: Manage permissions"),

    // ============================================
    // System Administration
    // ============================================
    MANAGE_SYSTEM_SETTINGS("إدارة إعدادات النظام", "Configure system-wide settings"),
    CHECK_ELIGIBILITY("التحقق من الأهلية", "Verify member insurance coverage"),
    
    // ============================================
    // Company Management (TBA Owner)
    // ============================================
    VIEW_COMPANIES("عرض الشركات", "View company information"),
    CREATE_COMPANY("إضافة شركة", "Create new company"),
    UPDATE_COMPANY("تعديل شركة", "Update existing company"),
    DELETE_COMPANY("حذف شركة", "Delete company"),
    PRINT_COMPANIES("طباعة الشركات", "Print companies list"),
    EXPORT_COMPANIES("تصدير الشركات", "Export companies data"),
    MANAGE_COMPANIES("إدارة الشركات", "Legacy: Full company management"),
    
    // ============================================
    // Insurance Company Management
    // ============================================
    VIEW_INSURANCE("عرض شركات التأمين", "View insurance company information"),
    CREATE_INSURANCE("إضافة شركة تأمين", "Create new insurance company"),
    UPDATE_INSURANCE("تعديل شركة تأمين", "Update existing insurance company"),
    DELETE_INSURANCE("حذف شركة تأمين", "Delete insurance company"),
    PRINT_INSURANCE("طباعة شركات التأمين", "Print insurance companies list"),
    EXPORT_INSURANCE("تصدير شركات التأمين", "Export insurance companies data"),
    MANAGE_INSURANCE("إدارة شركات التأمين", "Legacy: Full insurance management"),
    
    // ============================================
    // Reviewer Company Management
    // ============================================
    VIEW_REVIEWER("عرض شركات المراجعة", "View reviewer company information"),
    CREATE_REVIEWER("إضافة شركة مراجعة", "Create new reviewer company"),
    UPDATE_REVIEWER("تعديل شركة مراجعة", "Update existing reviewer company"),
    DELETE_REVIEWER("حذف شركة مراجعة", "Delete reviewer company"),
    PRINT_REVIEWER("طباعة شركات المراجعة", "Print reviewer companies list"),
    EXPORT_REVIEWER("تصدير شركات المراجعة", "Export reviewer companies data"),
    MANAGE_REVIEWER("إدارة شركات المراجعة الطبية", "Legacy: Full reviewer management"),
    
    // ============================================
    // Provider Management
    // ============================================
    VIEW_PROVIDERS("عرض مقدمي الخدمة", "View provider information"),
    CREATE_PROVIDER("إضافة مقدم خدمة", "Create new provider"),
    UPDATE_PROVIDER("تعديل مقدم خدمة", "Update existing provider"),
    DELETE_PROVIDER("حذف مقدم خدمة", "Delete provider"),
    PRINT_PROVIDERS("طباعة مقدمي الخدمة", "Print providers list"),
    EXPORT_PROVIDERS("تصدير مقدمي الخدمة", "Export providers data"),
    MANAGE_PROVIDERS("إدارة مقدمي الخدمة", "Legacy: Full provider management"),
    
    // ============================================
    // Provider Contracts Management
    // ============================================
    VIEW_PROVIDER_CONTRACTS("عرض عقود مقدمي الخدمة", "View provider contracts"),
    CREATE_PROVIDER_CONTRACT("إضافة عقد", "Create new contract"),
    UPDATE_PROVIDER_CONTRACT("تعديل عقد", "Update existing contract"),
    DELETE_PROVIDER_CONTRACT("حذف عقد", "Delete contract"),
    PRINT_PROVIDER_CONTRACTS("طباعة العقود", "Print contracts list"),
    EXPORT_PROVIDER_CONTRACTS("تصدير العقود", "Export contracts data"),
    MANAGE_PROVIDER_CONTRACTS("إدارة عقود مقدمي الخدمة", "Legacy: Full contract management"),
    
    // ============================================
    // Employer Management
    // ============================================
    VIEW_EMPLOYERS("عرض أصحاب العمل", "View employer information"),
    CREATE_EMPLOYER("إضافة صاحب عمل", "Create new employer"),
    UPDATE_EMPLOYER("تعديل صاحب عمل", "Update existing employer"),
    DELETE_EMPLOYER("حذف صاحب عمل", "Delete employer"),
    PRINT_EMPLOYERS("طباعة أصحاب العمل", "Print employers list"),
    EXPORT_EMPLOYERS("تصدير أصحاب العمل", "Export employers data"),
    MANAGE_EMPLOYERS("إدارة أصحاب العمل", "Legacy: Full employer management"),
    
    // ============================================
    // Member Management
    // ============================================
    VIEW_MEMBERS("عرض الأعضاء", "View member information"),
    CREATE_MEMBER("إضافة عضو", "Create new member"),
    UPDATE_MEMBER("تعديل عضو", "Update existing member"),
    DELETE_MEMBER("حذف عضو", "Delete member"),
    PRINT_MEMBERS("طباعة الأعضاء", "Print members list"),
    EXPORT_MEMBERS("تصدير الأعضاء", "Export members data"),
    IMPORT_MEMBERS("استيراد الأعضاء", "Import members from Excel"),
    MANAGE_MEMBERS("إدارة الأعضاء", "Legacy: Full member management"),
    
    // ============================================
    // Settlement Management
    // ============================================
    VIEW_SETTLEMENTS("عرض التسويات", "View settlement batches"),
    CREATE_SETTLEMENT("إنشاء دفعة تسوية", "Create new settlement batch"),
    UPDATE_SETTLEMENT("تعديل دفعة تسوية", "Update settlement batch"),
    DELETE_SETTLEMENT("حذف/إلغاء دفعة تسوية", "Cancel/Delete settlement batch"),
    PRINT_SETTLEMENTS("طباعة التسويات", "Print settlements list"),
    EXPORT_SETTLEMENTS("تصدير التسويات", "Export settlements data"),
    
    CONFIRM_SETTLEMENT_BATCH("تأكيد دفعة تسوية", "Confirm settlement batches"),
    PAY_SETTLEMENT_BATCH("دفع دفعة تسوية", "Mark settlement as paid"),
    CANCEL_SETTLEMENT_BATCH("إلغاء دفعة تسوية", "Cancel settlement"),
    CREATE_SETTLEMENT_BATCH("إنشاء دفعة (قديم)", "Legacy create"),
    MANAGE_SETTLEMENTS("إدارة التسويات", "Legacy: Full settlement management"),

    // ============================================
    // Claims Management
    // ============================================
    VIEW_CLAIMS("عرض المطالبات", "View claim information"),
    CREATE_CLAIM("إنشاء مطالبة", "Submit new claim"),
    UPDATE_CLAIM("تعديل مطالبة", "Update existing claim"),
    DELETE_CLAIM("حذف مطالبة", "Delete claim"),
    PRINT_CLAIMS("طباعة المطالبات", "Print claims list"),
    EXPORT_CLAIMS("تصدير المطالبات", "Export claims data"),
    
    APPROVE_CLAIMS("الموافقة على المطالبات", "Approve claims"),
    REJECT_CLAIMS("رفض المطالبات", "Reject claims"),
    VIEW_CLAIM_STATUS("عرض حالة المطالبة", "View claim status"),
    MANAGE_CLAIMS("إدارة المطالبات", "Legacy: Full claim management"),
    
    // ============================================
    // Visit Management
    // ============================================
    VIEW_VISITS("عرض الزيارات", "View visit information"),
    CREATE_VISIT("إضافة زيارة", "Register new visit"),
    UPDATE_VISIT("تعديل زيارة", "Update existing visit"),
    DELETE_VISIT("حذف زيارة", "Delete visit"),
    PRINT_VISITS("طباعة الزيارات", "Print visits list"),
    EXPORT_VISITS("تصدير الزيارات", "Export visits data"),
    MANAGE_VISITS("إدارة الزيارات", "Legacy: Full visit management"),
    
    // ============================================
    // Pre-Authorization Management
    // ============================================
    VIEW_PREAUTH("عرض الموافقات المسبقة", "View pre-authorizations"),
    CREATE_PREAUTH("إنشاء موافقة مسبقة", "Create pre-authorization"),
    UPDATE_PREAUTH("تعديل موافقة مسبقة", "Update pre-authorization"),
    DELETE_PREAUTH("حذف موافقة مسبقة", "Delete pre-authorization"),
    PRINT_PREAUTH("طباعة الموافقات", "Print pre-authorizations list"),
    EXPORT_PREAUTH("تصدير الموافقات", "Export pre-authorizations data"),
    
    // Specific actions
    APPROVE_PRE_AUTH("الموافقة على طلب مسبق", "Approve pre-auth"),
    REJECT_PRE_AUTH("رفض طلب مسبق", "Reject pre-auth"),
    CANCEL_PRE_AUTH("إلغاء طلب مسبق", "Cancel pre-auth"),
    
    // Compatible aliases
    VIEW_PRE_AUTH("عرض طلبات (قديم)", "Legacy view"),
    CREATE_PRE_AUTH("إنشاء طلب (قديم)", "Legacy create"),
    UPDATE_PRE_AUTH("تحديث طلب (قديم)", "Legacy update"),
    DELETE_PRE_AUTH("حذف طلب (قديم)", "Legacy delete"),
    MANAGE_PREAUTH("إدارة الموافقات المسبقة", "Legacy: Full management"),
    
    // ============================================
    // Medical Packages Management
    // ============================================
    VIEW_MEDICAL_PACKAGES("عرض الحزم الطبية", "View medical packages"),
    CREATE_MEDICAL_PACKAGE("إضافة حزمة طبية", "Create new package"),
    UPDATE_MEDICAL_PACKAGE("تعديل حزمة طبية", "Update existing package"),
    DELETE_MEDICAL_PACKAGE("حذف حزمة طبية", "Delete package"),
    PRINT_MEDICAL_PACKAGES("طباعة الحزم", "Print packages list"),
    EXPORT_MEDICAL_PACKAGES("تصدير الحزم", "Export packages data"),
    MANAGE_MEDICAL_PACKAGES("إدارة الحزم الطبية", "Legacy: Full management"),

    // ============================================
    // Benefit Policies Management
    // ============================================
    VIEW_BENEFIT_POLICIES("عرض وثائق التأمين", "View benefit policies"),
    CREATE_BENEFIT_POLICY("إضافة وثيقة", "Create new policy"),
    UPDATE_BENEFIT_POLICY("تعديل وثيقة", "Update existing policy"),
    DELETE_BENEFIT_POLICY("حذف وثيقة", "Delete policy"),
    PRINT_BENEFIT_POLICIES("طباعة الوثائق", "Print policies list"),
    EXPORT_BENEFIT_POLICIES("تصدير الوثائق", "Export policies data"),
    MANAGE_BENEFIT_POLICIES("إدارة وثائق التأمين", "Legacy: Full management"),

    // ============================================
    // Medical Services
    // ============================================
    VIEW_MEDICAL_SERVICES("عرض الخدمات الطبية", "View medical services"),
    CREATE_MEDICAL_SERVICE("إضافة خدمة طبية", "Create new service"),
    UPDATE_MEDICAL_SERVICE("تعديل خدمة طبية", "Update existing service"),
    DELETE_MEDICAL_SERVICE("حذف خدمة طبية", "Delete service"),
    PRINT_MEDICAL_SERVICES("طباعة الخدمات", "Print services list"),
    EXPORT_MEDICAL_SERVICES("تصدير الخدمات", "Export services data"),

    // ============================================
    // Reports and Analytics
    // ============================================
    VIEW_REPORTS("عرض التقارير", "View system reports"),
    CREATE_REPORT("إنشاء تقرير", "Create custom report"),
    PRINT_REPORTS("طباعة التقارير", "Print reports"),
    EXPORT_REPORTS("تصدير التقارير", "Export reports"),
    MANAGE_REPORTS("إدارة التقارير", "Legacy: Full report management"),
    VIEW_DASHBOARD("عرض لوحة التحكم", "View dashboard statistics"),
    
    // ============================================
    // Basic Data
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

    /**
     * Get the module name based on permission pattern.
     * Matches keys in frontend MODULE_NAMES_AR.
     */
    public String getModule() {
        String n = this.name();
        
        if (n.contains("USER")) return "USER";
        if (n.contains("ROLE") || n.contains("RBAC") || n.contains("PERMISSION")) return "SYSTEM"; // Roles are part of System/RBAC
        if (n.contains("SYSTEM") || n.contains("BASIC_DATA")) return "SYSTEM";
        
        if (n.contains("CLAIM")) return "CLAIM";
        if (n.contains("SETTLEMENT")) return "SETTLEMENT";
        
        if (n.contains("PROVIDER") || n.contains("CONTRACT")) return "PROVIDER";
        
        if (n.contains("MEMBER") || n.contains("VISIT") || n.contains("PREAUTH") || n.contains("PRE_AUTH") || n.contains("ELIGIBILITY")) return "MEMBER";
        
        if (n.contains("REPORT") || n.contains("DASHBOARD")) return "REPORT";
        
        if (n.contains("BENEFIT") || n.contains("INSURANCE")) return "BENEFIT";
        if (n.contains("MEDICAL_PACKAGE") || n.contains("MEDICAL_SERVICE")) return "PLAN"; // Medical Services & Packages -> Plan/Packages
        
        if (n.contains("COMPANY") || n.contains("EMPLOYER") || n.contains("REVIEWER")) return "SYSTEM"; // Entities Management -> System
        
        return "OTHER";
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
