/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔐 RBAC CONFIGURATION - PROFESSIONAL SINGLE SOURCE OF TRUTH
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ARCHITECTURE PRINCIPLES:
 * ✅ Permission-Based Access Control (NOT role-based)
 * ✅ Backend permissions === Frontend menu visibility
 * ✅ NO hardcoded role checks (except SUPER_ADMIN bypass)
 * ✅ Single source of truth for menu → permission mapping
 * 
 * VERSION: 3.0 - Professional RBAC (2026-01-29)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ROLES, PERMISSIONS, hasPermission } from 'constants/permissions.constants';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLE PERMISSIONS MAPPING
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SERVICE_PROVIDER]: [
    PERMISSIONS.VIEW_VISITS, PERMISSIONS.MANAGE_VISITS,
    PERMISSIONS.VIEW_CLAIMS, PERMISSIONS.CREATE_CLAIM, PERMISSIONS.UPDATE_CLAIM,
    PERMISSIONS.VIEW_PRE_AUTH, PERMISSIONS.CREATE_PRE_AUTH,
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.VIEW_PROVIDER_PORTAL
  ],

  [ROLES.PARTNER_MANAGER]: [
    PERMISSIONS.VIEW_VISITS,
    PERMISSIONS.VIEW_CLAIMS,
    PERMISSIONS.VIEW_PRE_AUTH,
    PERMISSIONS.VIEW_REPORTS
  ],

  [ROLES.MEDICAL_REVIEWER]: [
    PERMISSIONS.VIEW_CLAIMS, PERMISSIONS.APPROVE_CLAIMS, PERMISSIONS.REJECT_CLAIMS,
    PERMISSIONS.VIEW_PRE_AUTH, PERMISSIONS.APPROVE_PRE_AUTH, PERMISSIONS.REJECT_PRE_AUTH,
    PERMISSIONS.VIEW_REPORTS
  ],

  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.SETTLE_CLAIMS,
    PERMISSIONS.VIEW_CLAIMS,
    PERMISSIONS.VIEW_PROVIDERS
  ],

  [ROLES.SUPER_ADMIN]: ['ALL_PERMISSIONS']
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Filter menu items based on user permissions
 * @param {Array} menuItems - Full menu structure
 * @param {Object} user - User object with permissions
 * @returns {Array} Filtered menu items
 */
export const filterMenuByPermissions = (menuItems, user) => {
  if (!user) {
    return [];
  }

  // SUPER_ADMIN bypasses all menu filtering
  if (user.roles?.includes('SUPER_ADMIN')) {
    return menuItems;
  }

  /**
   * Filter recursive menu items
   */
  const filterRecursive = (items) => {
    return items
      .map(item => {
        // If item has children, filter them recursively
        if (item.children) {
          const filteredChildren = filterRecursive(item.children);

          // If no children remain, hide the parent (group or collapse)
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren
          };
        }

        // Check permission using centralized logic
        // Use either item.permission (inline) or item.id (centralized map)
        const canView = hasMenuPermission(user, item.id) || (item.permission && hasPermission(user, item.permission));

        if (!canView) {
          return null;
        }

        return item;
      })
      .filter(item => item !== null);
  };

  return filterRecursive(menuItems);
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MENU PERMISSION MAP (CANONICAL)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Maps each menu item to required permission(s).
 * If user has ANY of the permissions → menu item appears
 * If user has NONE → menu item hidden
 * 
 * Format:
 * 'menu-id': ['PERMISSION_1', 'PERMISSION_2'] // OR logic
 * 'menu-id': 'PERMISSION_1' // Single permission
 */
export const MENU_PERMISSIONS = {
  // 📊 DASHBOARD
  'dashboard': null,
  'employer-dashboard': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_EMPLOYERS],

  // 👥 MEMBERS
  'members': [PERMISSIONS.VIEW_MEMBERS, PERMISSIONS.MANAGE_MEMBERS],
  'eligibility-check': [PERMISSIONS.VIEW_MEMBERS],

  // 🏢 EMPLOYERS
  'employers': [PERMISSIONS.VIEW_EMPLOYERS, PERMISSIONS.MANAGE_EMPLOYERS],
  'employers-list': [PERMISSIONS.VIEW_EMPLOYERS, PERMISSIONS.MANAGE_EMPLOYERS],
  'benefit-policies': [PERMISSIONS.VIEW_BENEFIT_POLICIES, PERMISSIONS.MANAGE_BENEFIT_POLICIES],

  // 🏥 PROVIDERS
  'providers': [PERMISSIONS.VIEW_PROVIDERS, PERMISSIONS.MANAGE_PROVIDERS],
  'providers-list': [PERMISSIONS.VIEW_PROVIDERS, PERMISSIONS.MANAGE_PROVIDERS],
  'provider-contracts': [PERMISSIONS.VIEW_PROVIDER_CONTRACTS, PERMISSIONS.MANAGE_PROVIDER_CONTRACTS],

  // 💰 CLAIMS & APPROVALS
  'claims-approvals': [PERMISSIONS.VIEW_CLAIMS, PERMISSIONS.APPROVE_CLAIMS, PERMISSIONS.REJECT_CLAIMS, PERMISSIONS.VIEW_PRE_AUTH, PERMISSIONS.APPROVE_PRE_AUTH],
  'claims-inbox': [PERMISSIONS.APPROVE_CLAIMS, PERMISSIONS.REJECT_CLAIMS],
  'pre-approvals-inbox': [PERMISSIONS.APPROVE_PRE_AUTH, PERMISSIONS.REJECT_PRE_AUTH],
  'unified-approvals-dashboard': [PERMISSIONS.APPROVE_CLAIMS, PERMISSIONS.APPROVE_PRE_AUTH],
  'settlement-inbox': [PERMISSIONS.SETTLE_CLAIMS],

  // 💰 SETTLEMENT Management
  'settlement': [PERMISSIONS.SETTLE_CLAIMS],
  'settlement-batches': [PERMISSIONS.SETTLE_CLAIMS],
  'provider-accounts': [PERMISSIONS.SETTLE_CLAIMS, PERMISSIONS.VIEW_PROVIDERS],

  // 🏥 VISITS
  'visits': [PERMISSIONS.VIEW_VISITS, PERMISSIONS.MANAGE_VISITS],

  // 📋 POLICIES & PACKAGES
  'benefit-packages': [PERMISSIONS.VIEW_BENEFIT_PACKAGES, PERMISSIONS.MANAGE_BENEFIT_PACKAGES],
  'medical-categories': [PERMISSIONS.VIEW_MEDICAL_CATEGORIES, PERMISSIONS.MANAGE_MEDICAL_CATEGORIES],
  'medical-services': [PERMISSIONS.VIEW_MEDICAL_SERVICES, PERMISSIONS.MANAGE_MEDICAL_SERVICES],
  'medical-packages': [PERMISSIONS.VIEW_MEDICAL_PACKAGES, PERMISSIONS.MANAGE_MEDICAL_PACKAGES],

  // 📈 REPORTS
  'reports': [PERMISSIONS.VIEW_REPORTS],
  'claims-report': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CLAIMS],
  'pre-approvals-report': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_PRE_AUTH],
  'financial-reports': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.SETTLE_CLAIMS],
  'provider-pdf-reports': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_PROVIDERS],
  'provider-settlement-reports': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.SETTLE_CLAIMS],
  'employer-reports': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_EMPLOYERS],
  'visits-report': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_VISITS],
  'benefit-policy-report': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_BENEFIT_POLICIES],
  'beneficiaries-report': [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_MEMBERS],

  // 📂 DOCUMENTS
  'documents-library': [PERMISSIONS.VIEW_CLAIMS, PERMISSIONS.VIEW_PRE_AUTH, PERMISSIONS.VIEW_MEMBERS],

  // 🏥 PROVIDER PORTAL
  'group-provider-portal': [PERMISSIONS.VIEW_PROVIDER_PORTAL, PERMISSIONS.MANAGE_VISITS, PERMISSIONS.VIEW_MEMBERS],
  'provider-portal': [PERMISSIONS.VIEW_PROVIDER_PORTAL, PERMISSIONS.MANAGE_VISITS, PERMISSIONS.VIEW_MEMBERS],
  'provider-eligibility-check': [PERMISSIONS.VIEW_PROVIDER_PORTAL, PERMISSIONS.VIEW_MEMBERS],
  'provider-visit-log': [PERMISSIONS.VIEW_PROVIDER_PORTAL, PERMISSIONS.MANAGE_VISITS],
  'provider-documents': [PERMISSIONS.VIEW_PROVIDER_PORTAL, PERMISSIONS.VIEW_CLAIMS, PERMISSIONS.VIEW_PRE_AUTH],

  // 📂 MY SERVICES (Provider History)
  'group-my-services': [PERMISSIONS.VIEW_CLAIM_STATUS, PERMISSIONS.VIEW_PRE_AUTH],
  'my-services': [PERMISSIONS.VIEW_CLAIM_STATUS, PERMISSIONS.VIEW_PRE_AUTH],
  'provider-claims': [PERMISSIONS.VIEW_CLAIM_STATUS],
  'provider-pre-approvals': [PERMISSIONS.VIEW_PRE_AUTH],

  // ⚙️ SYSTEM SETTINGS
  'audit': [PERMISSIONS.VIEW_AUDIT_LOGS],
  'medical-taxonomy': [PERMISSIONS.VIEW_MEDICAL_CATEGORIES, PERMISSIONS.VIEW_MEDICAL_SERVICES, PERMISSIONS.VIEW_MEDICAL_PACKAGES],
  'organization-settings': [PERMISSIONS.MANAGE_SETTINGS, PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_ROLES],
  'company-settings': [PERMISSIONS.MANAGE_SETTINGS],
  'users-management': [PERMISSIONS.MANAGE_USERS],
  'roles-management': [PERMISSIONS.MANAGE_ROLES],
  'permissions-list': [PERMISSIONS.MANAGE_ROLES],
  'permission-matrix': [PERMISSIONS.MANAGE_ROLES]
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLE DEFAULT PERMISSIONS (FOR REFERENCE ONLY - NOT ENFORCED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is DOCUMENTATION only. Actual permissions come from backend.
 * Used only for:
 * - Understanding expected role capabilities
 * - Initial role setup in backend
 * - Testing scenarios
 */
export const ROLE_PERMISSION_REFERENCE = {
  // ───────────────────────────────────────────────────────────────────────────
  // 🔓 SUPER_ADMIN - All Permissions (Bypass)
  // ───────────────────────────────────────────────────────────────────────────
  SUPER_ADMIN: 'ALL_PERMISSIONS', // Bypass - sees everything

  // ───────────────────────────────────────────────────────────────────────────
  // 🏢 INSURANCE_ADMIN - Full Operational Access (No RBAC Management)
  // ───────────────────────────────────────────────────────────────────────────
  INSURANCE_ADMIN: [
    PERMISSIONS.VIEW_EMPLOYERS,
    PERMISSIONS.MANAGE_EMPLOYERS,
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.VIEW_PROVIDERS,
    PERMISSIONS.MANAGE_PROVIDERS,
    PERMISSIONS.VIEW_PROVIDER_CONTRACTS,
    PERMISSIONS.MANAGE_PROVIDER_CONTRACTS,
    PERMISSIONS.VIEW_CLAIMS,
    PERMISSIONS.MANAGE_CLAIMS,
    PERMISSIONS.APPROVE_CLAIMS,
    PERMISSIONS.REJECT_CLAIMS,
    PERMISSIONS.SETTLE_CLAIMS,
    PERMISSIONS.VIEW_PRE_AUTH,
    PERMISSIONS.MANAGE_PREAUTH,
    PERMISSIONS.APPROVE_PRE_AUTH,
    PERMISSIONS.REJECT_PRE_AUTH,
    PERMISSIONS.VIEW_VISITS,
    PERMISSIONS.MANAGE_VISITS,
    PERMISSIONS.VIEW_BENEFIT_POLICIES,
    PERMISSIONS.MANAGE_BENEFIT_POLICIES,
    PERMISSIONS.VIEW_MEDICAL_SERVICES,
    PERMISSIONS.MANAGE_MEDICAL_SERVICES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.MANAGE_SETTINGS
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // 👔 PARTNER_MANAGER (مدير الشريك) - Limited Operational View
  // ───────────────────────────────────────────────────────────────────────────
  PARTNER_MANAGER: [
    PERMISSIONS.VIEW_MEMBERS, // ✅ Can view insured members
    PERMISSIONS.VIEW_VISITS, // ✅ Can view visit logs
    PERMISSIONS.VIEW_CLAIMS, // ✅ Can view claims (read-only)
    PERMISSIONS.VIEW_BENEFIT_POLICIES, // ✅ Can view policies
    PERMISSIONS.VIEW_REPORTS // ✅ Can view reports
    // ❌ NO: MANAGE_*, APPROVE_*, SETTLE_*, RBAC, SETTINGS
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // 🩺 MEDICAL_REVIEWER (المراجع الطبي) - Review Only
  // ───────────────────────────────────────────────────────────────────────────
  MEDICAL_REVIEWER: [
    PERMISSIONS.VIEW_CLAIMS, // ✅ View claims for review
    PERMISSIONS.APPROVE_CLAIMS, // ✅ Approve claims
    PERMISSIONS.REJECT_CLAIMS, // ✅ Reject claims
    PERMISSIONS.VIEW_PRE_AUTH, // ✅ View pre-auth requests
    PERMISSIONS.APPROVE_PRE_AUTH, // ✅ Approve pre-auth
    PERMISSIONS.REJECT_PRE_AUTH, // ✅ Reject pre-auth
    PERMISSIONS.VIEW_MEDICAL_SERVICES, // ✅ View services for reference
    PERMISSIONS.VIEW_REPORTS // ✅ View review reports
    // ❌ NO: VISITS, MEMBERS, EMPLOYERS, PROVIDERS, FINANCIAL, SETTINGS
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // 💰 ACCOUNTANT (المحاسب) - Financial & Reports Only
  // ───────────────────────────────────────────────────────────────────────────
  ACCOUNTANT: [
    PERMISSIONS.VIEW_CLAIMS, // ✅ View claims for accounting
    PERMISSIONS.SETTLE_CLAIMS, // ✅ Financial settlement
    PERMISSIONS.VIEW_PROVIDERS, // ✅ View providers for settlement
    PERMISSIONS.VIEW_PROVIDER_CONTRACTS, // ✅ View contracts for pricing
    PERMISSIONS.VIEW_EMPLOYERS, // ✅ View employers for billing
    PERMISSIONS.VIEW_REPORTS, // ✅ View financial reports
    PERMISSIONS.MANAGE_REPORTS // ✅ Generate custom reports
    // ❌ NO: MEMBERS, VISITS, PRE_AUTH, MEDICAL_REVIEW, SETTINGS
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // 🏥 PROVIDER (مقدم الخدمة)
  // ───────────────────────────────────────────────────────────────────────────
  PROVIDER: [
    PERMISSIONS.VIEW_MEMBERS, // ✅ Eligibility check only
    PERMISSIONS.MANAGE_VISITS, // ✅ Log visits (main functionality)
    PERMISSIONS.CREATE_CLAIM, // ✅ Create claims from visits
    PERMISSIONS.CREATE_PRE_AUTH, // ✅ Create pre-auth from visits
    PERMISSIONS.VIEW_CLAIM_STATUS, // ✅ View status of submitted claims
    PERMISSIONS.VIEW_PRE_AUTH // ✅ View status of submitted pre-auth
    // ❌ NO: APPROVE_*, REJECT_*, SETTLE_*, REPORTS, SETTINGS, EMPLOYERS
  ]
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHECK IF USER HAS PERMISSION FOR MENU ITEM
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const hasMenuPermission = (user, menuId) => {
  // SUPER_ADMIN bypass
  if (user?.roles?.includes('SUPER_ADMIN')) {
    return true;
  }

  // Get required permissions for this menu item
  const requiredPermissions = MENU_PERMISSIONS[menuId];

  // If no permissions required (null), everyone can access
  if (!requiredPermissions) {
    return true;
  }

  // If menu has no permission config, deny access (safe default)
  const userPermissions = user?.permissions || [];

  // Single permission (string)
  if (typeof requiredPermissions === 'string') {
    return userPermissions.includes(requiredPermissions);
  }

  // Multiple permissions (array) - OR logic (user needs ANY of them)
  if (Array.isArray(requiredPermissions)) {
    return requiredPermissions.some((perm) => userPermissions.includes(perm));
  }

  // Unknown format - deny access
  return false;
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHECK IF USER CAN ACCESS ROUTE
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const canAccessRoute = (user, path) => {
  // SUPER_ADMIN bypass
  if (user?.roles?.includes('SUPER_ADMIN')) {
    return true;
  }

  // Map common routes to menu IDs
  const routeToMenuMap = {
    '/dashboard': 'dashboard',
    '/members': 'members',
    '/employers': 'employers',
    '/providers': 'providers',
    '/claims': 'claims',
    '/claims/inbox': 'claims-inbox',
    '/pre-approvals': 'pre-approvals',
    '/pre-approvals/inbox': 'pre-approvals-inbox',
    '/visits': 'visits',
    '/reports': 'reports',
    '/rbac': 'rbac',
    '/settings': 'settings'
  };

  // Find matching menu ID
  const menuId = routeToMenuMap[path];
  if (!menuId) {
    // Route not mapped - deny access by default
    return false;
  }

  return hasMenuPermission(user, menuId);
};

export default {
  MENU_PERMISSIONS,
  ROLE_PERMISSION_REFERENCE,
  hasMenuPermission,
  filterMenuByPermissions,
  canAccessRoute
};
