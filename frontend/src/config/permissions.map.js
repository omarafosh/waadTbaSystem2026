/**
 * 🔑 Permission Mapping - خريطة الصلاحيات التفصيلية
 * 
 * يحتوي هذا الملف على تعريف شامل لجميع الصلاحيات في النظام
 * كل صلاحية لها:
 * - key: المعرف الفريد
 * - label: الاسم العربي
 * - category: التصنيف
 * - description: الوصف التفصيلي
 */

// ==================== Categories ====================

export const PERMISSION_CATEGORIES = {
  VISITS: 'VISITS',
  CLAIMS: 'CLAIMS',
  PREAUTH: 'PREAUTH',
  MEMBERS: 'MEMBERS',
  DOCUMENTS: 'DOCUMENTS',
  REPORTS: 'REPORTS',
  FINANCIAL: 'FINANCIAL',
  ADMIN: 'ADMIN'
};

// ==================== Permissions ====================

export const PERMISSIONS = {
  // ========== Visits Permissions ==========
  VISITS_VIEW: {
    key: 'VISITS_VIEW',
    label: 'عرض الزيارات',
    category: PERMISSION_CATEGORIES.VISITS,
    description: 'السماح بعرض قائمة الزيارات وتفاصيلها'
  },
  VISITS_CREATE: {
    key: 'VISITS_CREATE',
    label: 'إنشاء زيارة',
    category: PERMISSION_CATEGORIES.VISITS,
    description: 'السماح بإنشاء زيارة جديدة'
  },
  VISITS_UPDATE: {
    key: 'VISITS_UPDATE',
    label: 'تحديث الزيارة',
    category: PERMISSION_CATEGORIES.VISITS,
    description: 'السماح بتعديل بيانات الزيارة'
  },
  VISITS_DELETE: {
    key: 'VISITS_DELETE',
    label: 'حذف الزيارة',
    category: PERMISSION_CATEGORIES.VISITS,
    description: 'السماح بحذف الزيارة'
  },

  // ========== Claims Permissions ==========
  CLAIMS_VIEW: {
    key: 'CLAIMS_VIEW',
    label: 'عرض المطالبات',
    category: PERMISSION_CATEGORIES.CLAIMS,
    description: 'السماح بعرض قائمة المطالبات وتفاصيلها'
  },
  CLAIMS_CREATE: {
    key: 'CLAIMS_CREATE',
    label: 'إنشاء مطالبة',
    category: PERMISSION_CATEGORIES.CLAIMS,
    description: 'السماح بإنشاء مطالبة جديدة'
  },
  CLAIMS_UPDATE: {
    key: 'CLAIMS_UPDATE',
    label: 'تحديث المطالبة',
    category: PERMISSION_CATEGORIES.CLAIMS,
    description: 'السماح بتعديل بيانات المطالبة'
  },
  CLAIMS_DELETE: {
    key: 'CLAIMS_DELETE',
    label: 'حذف المطالبة',
    category: PERMISSION_CATEGORIES.CLAIMS,
    description: 'السماح بحذف المطالبة'
  },
  CLAIMS_REVIEW: {
    key: 'CLAIMS_REVIEW',
    label: 'مراجعة المطالبة',
    category: PERMISSION_CATEGORIES.CLAIMS,
    description: 'السماح بمراجعة المطالبات طبياً'
  },
  CLAIMS_APPROVE: {
    key: 'CLAIMS_APPROVE',
    label: 'الموافقة على المطالبة',
    category: PERMISSION_CATEGORIES.CLAIMS,
    description: 'السماح بالموافقة على المطالبة'
  },
  CLAIMS_REJECT: {
    key: 'CLAIMS_REJECT',
    label: 'رفض المطالبة',
    category: PERMISSION_CATEGORIES.CLAIMS,
    description: 'السماح برفض المطالبة'
  },

  // ========== Pre-Authorization Permissions ==========
  PREAUTH_VIEW: {
    key: 'PREAUTH_VIEW',
    label: 'عرض الموافقات المسبقة',
    category: PERMISSION_CATEGORIES.PREAUTH,
    description: 'السماح بعرض قائمة الموافقات المسبقة'
  },
  PREAUTH_CREATE: {
    key: 'PREAUTH_CREATE',
    label: 'إنشاء موافقة مسبقة',
    category: PERMISSION_CATEGORIES.PREAUTH,
    description: 'السماح بإنشاء طلب موافقة مسبقة'
  },
  PREAUTH_UPDATE: {
    key: 'PREAUTH_UPDATE',
    label: 'تحديث الموافقة المسبقة',
    category: PERMISSION_CATEGORIES.PREAUTH,
    description: 'السماح بتعديل طلب الموافقة المسبقة'
  },
  PREAUTH_DELETE: {
    key: 'PREAUTH_DELETE',
    label: 'حذف الموافقة المسبقة',
    category: PERMISSION_CATEGORIES.PREAUTH,
    description: 'السماح بحذف طلب الموافقة المسبقة'
  },
  PREAUTH_REVIEW: {
    key: 'PREAUTH_REVIEW',
    label: 'مراجعة الموافقة المسبقة',
    category: PERMISSION_CATEGORIES.PREAUTH,
    description: 'السماح بمراجعة طلبات الموافقة المسبقة'
  },
  PREAUTH_APPROVE: {
    key: 'PREAUTH_APPROVE',
    label: 'الموافقة على الطلب',
    category: PERMISSION_CATEGORIES.PREAUTH,
    description: 'السماح بالموافقة على طلب الموافقة المسبقة'
  },
  PREAUTH_REJECT: {
    key: 'PREAUTH_REJECT',
    label: 'رفض الطلب',
    category: PERMISSION_CATEGORIES.PREAUTH,
    description: 'السماح برفض طلب الموافقة المسبقة'
  },

  // ========== Members Permissions ==========
  MEMBERS_VIEW: {
    key: 'MEMBERS_VIEW',
    label: 'عرض المستفيدين',
    category: PERMISSION_CATEGORIES.MEMBERS,
    description: 'السماح بعرض قائمة المستفيدين وبياناتهم'
  },
  MEMBERS_CREATE: {
    key: 'MEMBERS_CREATE',
    label: 'إضافة مؤمن عليه',
    category: PERMISSION_CATEGORIES.MEMBERS,
    description: 'السماح بإضافة مؤمن عليه جديد'
  },
  MEMBERS_UPDATE: {
    key: 'MEMBERS_UPDATE',
    label: 'تحديث بيانات المستفيد',
    category: PERMISSION_CATEGORIES.MEMBERS,
    description: 'السماح بتعديل بيانات المستفيد'
  },
  MEMBERS_DELETE: {
    key: 'MEMBERS_DELETE',
    label: 'حذف المستفيد',
    category: PERMISSION_CATEGORIES.MEMBERS,
    description: 'السماح بحذف المستفيد'
  },

  // ========== Documents Permissions ==========
  DOCUMENTS_VIEW: {
    key: 'DOCUMENTS_VIEW',
    label: 'عرض المستندات',
    category: PERMISSION_CATEGORIES.DOCUMENTS,
    description: 'السماح بعرض المستندات المرفقة'
  },
  DOCUMENTS_UPLOAD: {
    key: 'DOCUMENTS_UPLOAD',
    label: 'رفع مستندات',
    category: PERMISSION_CATEGORIES.DOCUMENTS,
    description: 'السماح برفع مستندات جديدة'
  },
  DOCUMENTS_DELETE: {
    key: 'DOCUMENTS_DELETE',
    label: 'حذف المستندات',
    category: PERMISSION_CATEGORIES.DOCUMENTS,
    description: 'السماح بحذف المستندات'
  },

  // ========== Reports Permissions ==========
  PROVIDER_REPORTS: {
    key: 'PROVIDER_REPORTS',
    label: 'تقارير مقدم الخدمة',
    category: PERMISSION_CATEGORIES.REPORTS,
    description: 'السماح بعرض تقارير مقدم الخدمة'
  },
  PARTNER_REPORTS: {
    key: 'PARTNER_REPORTS',
    label: 'تقارير الشريك',
    category: PERMISSION_CATEGORIES.REPORTS,
    description: 'السماح بعرض تقارير الشريك'
  },
  MEDICAL_REPORTS: {
    key: 'MEDICAL_REPORTS',
    label: 'التقارير الطبية',
    category: PERMISSION_CATEGORIES.REPORTS,
    description: 'السماح بعرض التقارير الطبية'
  },
  FINANCIAL_REPORTS: {
    key: 'FINANCIAL_REPORTS',
    label: 'التقارير المالية',
    category: PERMISSION_CATEGORIES.FINANCIAL,
    description: 'السماح بعرض التقارير المالية'
  },

  // ========== Financial Permissions ==========
  PROVIDER_SETTLEMENT: {
    key: 'PROVIDER_SETTLEMENT',
    label: 'تسويات مقدم الخدمة',
    category: PERMISSION_CATEGORIES.FINANCIAL,
    description: 'السماح بعرض وإدارة تسويات مقدم الخدمة'
  },
  PARTNER_FINANCIAL_REPORTS: {
    key: 'PARTNER_FINANCIAL_REPORTS',
    label: 'التقارير المالية للشريك',
    category: PERMISSION_CATEGORIES.FINANCIAL,
    description: 'السماح بعرض التقارير المالية للشريك'
  },

  // ========== Admin Permissions ==========
  SYSTEM_SETTINGS: {
    key: 'SYSTEM_SETTINGS',
    label: 'إعدادات النظام',
    category: PERMISSION_CATEGORIES.ADMIN,
    description: 'السماح بالوصول إلى إعدادات النظام'
  },
  USER_MANAGEMENT: {
    key: 'USER_MANAGEMENT',
    label: 'إدارة المستخدمين',
    category: PERMISSION_CATEGORIES.ADMIN,
    description: 'السماح بإدارة المستخدمين والصلاحيات'
  },
  COMPANY_MANAGEMENT: {
    key: 'COMPANY_MANAGEMENT',
    label: 'إدارة الشركات',
    category: PERMISSION_CATEGORIES.ADMIN,
    description: 'السماح بإدارة الشركات والشركاء'
  }
};

// ==================== Helper Functions ====================

/**
 * الحصول على جميع الصلاحيات كمصفوفة
 */
export const getAllPermissions = () => {
  return Object.values(PERMISSIONS);
};

/**
 * الحصول على الصلاحيات حسب التصنيف
 */
export const getPermissionsByCategory = (category) => {
  return Object.values(PERMISSIONS).filter(p => p.category === category);
};

/**
 * الحصول على صلاحية بالمفتاح
 */
export const getPermissionByKey = (key) => {
  return PERMISSIONS[key] || null;
};

/**
 * التحقق من وجود صلاحية
 */
export const hasPermissionKey = (key) => {
  return key in PERMISSIONS;
};

/**
 * الحصول على جميع مفاتيح الصلاحيات
 */
export const getAllPermissionKeys = () => {
  return Object.keys(PERMISSIONS);
};

/**
 * تجميع الصلاحيات حسب التصنيف
 */
export const groupPermissionsByCategory = () => {
  const grouped = {};

  Object.values(PERMISSION_CATEGORIES).forEach(category => {
    grouped[category] = getPermissionsByCategory(category);
  });

  return grouped;
};

// ==================== Export Default ====================

export default {
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  getAllPermissions,
  getPermissionsByCategory,
  getPermissionByKey,
  hasPermissionKey,
  getAllPermissionKeys,
  groupPermissionsByCategory
};
