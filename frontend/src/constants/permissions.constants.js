/**
 * Centralized Permission Constants
 *
 * ENTERPRISE-GRADE RBAC Permission System
 *
 * These constants MUST match backend authority names exactly.
 * Backend uses: @PreAuthorize("hasAuthority('MANAGE_EMPLOYERS')")
 *
 * Permission Naming Convention:
 * - MANAGE_* = Full CRUD access (Create, Read, Update, Delete)
 * - VIEW_* = Read-only access
 *
 * Usage:
 * import { PERMISSIONS, ROLES, hasPermission, canCreate } from 'constants/permissions.constants';
 */

// ============================================================================
// ROLES - User Role Constants
// ============================================================================

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN', // Full system access - bypasses all checks
  ADMIN: 'ADMIN', // Legacy admin role
  INSURANCE_ADMIN: 'INSURANCE_ADMIN', // Insurance company administrator
  EMPLOYER_ADMIN: 'EMPLOYER_ADMIN', // Employer organization administrator
  PROVIDER: 'PROVIDER', // Healthcare provider (hospital, clinic, etc.)
  REVIEWER: 'REVIEWER', // Claims reviewer
  USER: 'USER' // Basic user
};

// ============================================================================
// PERMISSIONS - Granular Authority Constants (Match Backend Exactly)
// ============================================================================

export const PERMISSIONS = {
  // ========== Employers ==========
  MANAGE_EMPLOYERS: 'MANAGE_EMPLOYERS', // Create, Update, Delete employers
  VIEW_EMPLOYERS: 'VIEW_EMPLOYERS', // View employer list and details

  // ========== Members ==========
  MANAGE_MEMBERS: 'MANAGE_MEMBERS', // Create, Update, Delete members
  VIEW_MEMBERS: 'VIEW_MEMBERS', // View member list and details
  IMPORT_MEMBERS: 'IMPORT_MEMBERS', // Bulk import members from Excel

  // ========== Providers ==========
  MANAGE_PROVIDERS: 'MANAGE_PROVIDERS', // Create, Update, Delete providers
  VIEW_PROVIDERS: 'VIEW_PROVIDERS', // View provider list and details

  // ========== Provider Contracts ==========
  MANAGE_PROVIDER_CONTRACTS: 'MANAGE_PROVIDER_CONTRACTS',
  VIEW_PROVIDER_CONTRACTS: 'VIEW_PROVIDER_CONTRACTS',

  // ========== Medical Services ==========
  MANAGE_MEDICAL_SERVICES: 'MANAGE_MEDICAL_SERVICES',
  VIEW_MEDICAL_SERVICES: 'VIEW_MEDICAL_SERVICES',

  // ========== Medical Categories ==========
  MANAGE_MEDICAL_CATEGORIES: 'MANAGE_MEDICAL_CATEGORIES',
  VIEW_MEDICAL_CATEGORIES: 'VIEW_MEDICAL_CATEGORIES',

  // ========== Medical Packages ==========
  MANAGE_MEDICAL_PACKAGES: 'MANAGE_MEDICAL_PACKAGES',
  VIEW_MEDICAL_PACKAGES: 'VIEW_MEDICAL_PACKAGES',

  // ========== Benefit Packages ==========
  MANAGE_BENEFIT_PACKAGES: 'MANAGE_BENEFIT_PACKAGES',
  VIEW_BENEFIT_PACKAGES: 'VIEW_BENEFIT_PACKAGES',

  // ========== Benefit Policies ==========
  MANAGE_BENEFIT_POLICIES: 'MANAGE_BENEFIT_POLICIES',
  VIEW_BENEFIT_POLICIES: 'VIEW_BENEFIT_POLICIES',

  // ========== Claims ==========
  // Granular permissions (match Backend exactly)
  VIEW_CLAIMS: 'VIEW_CLAIMS', // View claims list and details
  CREATE_CLAIM: 'CREATE_CLAIM', // Create claims
  UPDATE_CLAIM: 'UPDATE_CLAIM', // Update claims
  APPROVE_CLAIMS: 'APPROVE_CLAIMS', // Approve claims
  REJECT_CLAIMS: 'REJECT_CLAIMS', // Reject claims
  SETTLE_CLAIMS: 'SETTLE_CLAIMS', // Financial settlement
  VIEW_CLAIM_STATUS: 'VIEW_CLAIM_STATUS', // View claim status only
  MANAGE_CLAIMS: 'MANAGE_CLAIMS', // Full CRUD access
  PROCESS_CLAIMS: 'APPROVE_CLAIMS', // Alias for processing

  // ========== Pre-Approvals / Pre-Authorization ==========
  // Granular permissions (match Backend exactly)
  VIEW_PRE_AUTH: 'VIEW_PRE_AUTH',
  CREATE_PRE_AUTH: 'CREATE_PRE_AUTH',
  UPDATE_PRE_AUTH: 'UPDATE_PRE_AUTH',
  APPROVE_PRE_AUTH: 'APPROVE_PRE_AUTH',
  REJECT_PRE_AUTH: 'REJECT_PRE_AUTH',
  CANCEL_PRE_AUTH: 'CANCEL_PRE_AUTH',
  DELETE_PRE_AUTH: 'DELETE_PRE_AUTH',
  // Legacy aliases (for backward compatibility)
  MANAGE_PRE_APPROVALS: 'MANAGE_PREAUTH',
  VIEW_PRE_APPROVALS: 'VIEW_PRE_AUTH',
  PROCESS_PRE_APPROVALS: 'APPROVE_PRE_AUTH',
  // Alias for convenience
  PREAPPROVAL_READ: 'VIEW_PRE_AUTH',
  PREAPPROVAL_WRITE: 'APPROVE_PRE_AUTH',

  // ========== Visits ==========
  MANAGE_VISITS: 'MANAGE_VISITS',
  VIEW_VISITS: 'VIEW_VISITS',

  // ========== Insurance Policies ==========
  MANAGE_INSURANCE_POLICIES: 'MANAGE_INSURANCE_POLICIES',
  VIEW_INSURANCE_POLICIES: 'VIEW_INSURANCE_POLICIES',

  // ========== Insurance Companies ==========
  MANAGE_INSURANCE_COMPANIES: 'MANAGE_INSURANCE_COMPANIES',
  VIEW_INSURANCE_COMPANIES: 'VIEW_INSURANCE_COMPANIES',

  // ========== Users & RBAC ==========
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_USERS: 'VIEW_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  VIEW_ROLES: 'VIEW_ROLES',

  // ========== System ==========
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  EXPORT_AUDIT: 'EXPORT_AUDIT',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_REPORTS: 'VIEW_REPORTS'
};

// ============================================================================
// PERMISSION GROUPS - For common access patterns
// ============================================================================

/**
 * Permission groups for common operations
 * Use these for UI guards that check multiple related permissions
 */
export const PERMISSION_GROUPS = {
  // Full TPA Operations access
  TPA_FULL_ACCESS: [
    PERMISSIONS.MANAGE_EMPLOYERS,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_PROVIDERS,
    PERMISSIONS.MANAGE_CLAIMS,
    PERMISSIONS.MANAGE_PRE_APPROVALS
  ],

  // Read-only dashboard access
  DASHBOARD_VIEW: [PERMISSIONS.VIEW_EMPLOYERS, PERMISSIONS.VIEW_MEMBERS, PERMISSIONS.VIEW_CLAIMS],

  // Medical network management
  MEDICAL_NETWORK_MANAGE: [
    PERMISSIONS.MANAGE_PROVIDERS,
    PERMISSIONS.MANAGE_MEDICAL_SERVICES,
    PERMISSIONS.MANAGE_MEDICAL_CATEGORIES,
    PERMISSIONS.MANAGE_MEDICAL_PACKAGES
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with roles and permissions arrays
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;

  // SUPER_ADMIN bypasses all permission checks
  if (user.roles?.includes(ROLES.SUPER_ADMIN)) return true;

  // Check if user has the specific permission
  return user.permissions?.includes(permission) || false;
};

/**
 * Check if user has ANY of the specified permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user) return false;
  if (user.roles?.includes(ROLES.SUPER_ADMIN)) return true;

  return permissions.some((perm) => user.permissions?.includes(perm));
};

/**
 * Check if user has ALL specified permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user) return false;
  if (user.roles?.includes(ROLES.SUPER_ADMIN)) return true;

  return permissions.every((perm) => user.permissions?.includes(perm));
};

/**
 * Check if user can create (needs MANAGE_* permission)
 * @param {Object} user - User object
 * @param {string} resource - Resource name (e.g., 'EMPLOYERS', 'MEMBERS')
 * @returns {boolean}
 */
export const canCreate = (user, resource) => {
  return hasPermission(user, `MANAGE_${resource.toUpperCase()}`);
};

/**
 * Check if user can view (needs VIEW_* or MANAGE_* permission)
 * @param {Object} user - User object
 * @param {string} resource - Resource name
 * @returns {boolean}
 */
export const canView = (user, resource) => {
  const manageKey = `MANAGE_${resource.toUpperCase()}`;
  const viewKey = `VIEW_${resource.toUpperCase()}`;
  return hasPermission(user, manageKey) || hasPermission(user, viewKey);
};

/**
 * Check if user can update (needs MANAGE_* permission)
 * Alias for canCreate - same permission controls both
 */
export const canUpdate = canCreate;

/**
 * Check if user can delete (needs MANAGE_* permission)
 * Alias for canCreate - same permission controls both
 */
export const canDelete = canCreate;

/**
 * Check if user is SUPER_ADMIN
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  return user?.roles?.includes(ROLES.SUPER_ADMIN) || false;
};

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  if (!user) return false;
  // SUPER_ADMIN implicitly has all roles
  if (user.roles?.includes(ROLES.SUPER_ADMIN)) return true;
  return user.roles?.includes(role) || false;
};

/**
 * Check if user has ANY of the specified roles
 * @param {Object} user - User object
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean}
 */
export const hasAnyRole = (user, roles) => {
  if (!user) return false;
  if (user.roles?.includes(ROLES.SUPER_ADMIN)) return true;

  return roles.some((role) => user.roles?.includes(role));
};

// ============================================================================
// LEGACY COMPATIBILITY - Mapping old permission names to new
// ============================================================================

/**
 * Legacy permission mapping for gradual migration
 * Maps old permission formats to new SCREAMING_SNAKE_CASE
 *
 * NOTE: SUPER_ADMIN bypasses all checks, so these mappings
 * are primarily for ADMIN and other roles that have specific permissions.
 */
export const LEGACY_PERMISSION_MAP = {
  // ========== Dot-notation format ==========
  'benefit_policies.view': PERMISSIONS.VIEW_BENEFIT_POLICIES,
  'benefit_policies.create': PERMISSIONS.MANAGE_BENEFIT_POLICIES,
  'benefit_policies.update': PERMISSIONS.MANAGE_BENEFIT_POLICIES,
  'benefit_policies.delete': PERMISSIONS.MANAGE_BENEFIT_POLICIES,
  'admin.users.view': PERMISSIONS.VIEW_USERS,
  'admin.users.manage': PERMISSIONS.MANAGE_USERS,
  'rbac.view': PERMISSIONS.VIEW_ROLES,
  'settings.view': PERMISSIONS.MANAGE_SETTINGS,

  // ========== UPPERCASE format (found in pages) ==========
  // Policies module
  POLICY_READ: PERMISSIONS.VIEW_INSURANCE_POLICIES,
  POLICY_CREATE: PERMISSIONS.MANAGE_INSURANCE_POLICIES,
  POLICY_UPDATE: PERMISSIONS.MANAGE_INSURANCE_POLICIES,
  POLICY_DELETE: PERMISSIONS.MANAGE_INSURANCE_POLICIES,

  // Insurance Policies module
  INSURANCE_POLICY_VIEW: PERMISSIONS.VIEW_INSURANCE_POLICIES,
  INSURANCE_POLICY_CREATE: PERMISSIONS.MANAGE_INSURANCE_POLICIES,
  INSURANCE_POLICY_UPDATE: PERMISSIONS.MANAGE_INSURANCE_POLICIES,
  INSURANCE_POLICY_DELETE: PERMISSIONS.MANAGE_INSURANCE_POLICIES,

  // Users module
  USER_VIEW: PERMISSIONS.VIEW_USERS,
  USER_CREATE: PERMISSIONS.MANAGE_USERS,
  USER_UPDATE: PERMISSIONS.MANAGE_USERS,
  USER_DELETE: PERMISSIONS.MANAGE_USERS,

  // Roles module
  ROLE_VIEW: PERMISSIONS.VIEW_ROLES,
  ROLE_CREATE: PERMISSIONS.MANAGE_ROLES,
  ROLE_UPDATE: PERMISSIONS.MANAGE_ROLES,
  ROLE_DELETE: PERMISSIONS.MANAGE_ROLES,

  // Companies module
  COMPANY_VIEW: PERMISSIONS.VIEW_INSURANCE_COMPANIES,
  COMPANY_CREATE: PERMISSIONS.MANAGE_INSURANCE_COMPANIES,
  COMPANY_UPDATE: PERMISSIONS.MANAGE_INSURANCE_COMPANIES,
  COMPANY_DELETE: PERMISSIONS.MANAGE_INSURANCE_COMPANIES
};

/**
 * Convert legacy permission to new format
 * @param {string} legacyPermission - Old format permission
 * @returns {string} New format permission
 */
export const convertLegacyPermission = (legacyPermission) => {
  return LEGACY_PERMISSION_MAP[legacyPermission] || legacyPermission;
};

export default {
  ROLES,
  PERMISSIONS,
  PERMISSION_GROUPS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canCreate,
  canView,
  canUpdate,
  canDelete,
  isSuperAdmin,
  hasRole,
  hasAnyRole,
  LEGACY_PERMISSION_MAP,
  convertLegacyPermission
};
