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

import { SystemRole as ROLES } from './rbac';

export { ROLES };

// ============================================================================
// PERMISSIONS - Granular Authority Constants (Match Backend Exactly)
// ============================================================================

export const PERMISSIONS = {
  // ========== Employers ==========
  MANAGE_EMPLOYERS: 'EMPLOYER_EDIT',
  VIEW_EMPLOYERS: 'EMPLOYER_VIEW',

  // ========== Members ==========
  MANAGE_MEMBERS: 'MEMBER_EDIT',
  VIEW_MEMBERS: 'MEMBER_VIEW',
  IMPORT_MEMBERS: 'MEMBER_IMPORT',

  // ========== Providers ==========
  MANAGE_PROVIDERS: 'PROVIDER_EDIT',
  VIEW_PROVIDERS: 'PROVIDER_VIEW',

  // ========== Provider Contracts ==========
  MANAGE_PROVIDER_CONTRACTS: 'CONTRACT_EDIT',
  VIEW_PROVIDER_CONTRACTS: 'CONTRACT_VIEW',

  // ========== Medical Services ==========
  MANAGE_MEDICAL_SERVICES: 'MEDICAL_SERVICE_EDIT',
  VIEW_MEDICAL_SERVICES: 'MEDICAL_SERVICE_VIEW',

  // ========== Medical Categories ==========
  MANAGE_MEDICAL_CATEGORIES: 'MEDICAL_CATEGORY_EDIT',
  VIEW_MEDICAL_CATEGORIES: 'MEDICAL_CATEGORY_VIEW',

  // ========== Medical Packages ==========
  MANAGE_MEDICAL_PACKAGES: 'MEDICAL_PACKAGE_EDIT',
  VIEW_MEDICAL_PACKAGES: 'MEDICAL_PACKAGE_VIEW',

  // ========== Benefit Packages ==========
  MANAGE_BENEFIT_PACKAGES: 'BENEFIT_PACKAGE_EDIT',
  VIEW_BENEFIT_PACKAGES: 'BENEFIT_PACKAGE_VIEW',

  // ========== Benefit Policies ==========
  MANAGE_BENEFIT_POLICIES: 'POLICY_EDIT',
  VIEW_BENEFIT_POLICIES: 'POLICY_VIEW',

  // ========== Claims ==========
  VIEW_CLAIMS: 'CLAIM_VIEW',
  CREATE_CLAIM: 'CLAIM_CREATE',
  UPDATE_CLAIM: 'CLAIM_EDIT',
  APPROVE_CLAIMS: 'CLAIM_EDIT', // Reviewers edit to approve
  REJECT_CLAIMS: 'CLAIM_EDIT',
  SETTLE_CLAIMS: 'CLAIM_EDIT',
  VIEW_CLAIM_STATUS: 'CLAIM_VIEW',
  MANAGE_CLAIMS: 'CLAIM_EDIT',
  PROCESS_CLAIMS: 'CLAIM_EDIT',

  // ========== Pre-Approvals ==========
  VIEW_PRE_AUTH: 'PREAUTH_VIEW',
  CREATE_PRE_AUTH: 'PREAUTH_CREATE',
  APPROVE_PRE_AUTH: 'PREAUTH_EDIT',
  REJECT_PRE_AUTH: 'PREAUTH_EDIT',
  MANAGE_PREAUTH: 'PREAUTH_EDIT',

  // ========== Visits ==========
  MANAGE_VISITS: 'VISIT_EDIT',
  VIEW_VISITS: 'VISIT_VIEW',

  // ========== Users & RBAC ==========
  MANAGE_USERS: 'USER_EDIT',
  VIEW_USERS: 'USER_VIEW',
  MANAGE_ROLES: 'USER_EDIT', // Roles managed by user admin
  VIEW_ROLES: 'USER_VIEW',

  // ========== System ==========
  VIEW_AUDIT_LOGS: 'AUDIT_VIEW',
  MANAGE_SETTINGS: 'SETTINGS_EDIT',
  VIEW_REPORTS: 'REPORTS_VIEW',

  // ========== Provider Portal ==========
  VIEW_PROVIDER_PORTAL: 'PROVIDER_PORTAL_VIEW'
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
