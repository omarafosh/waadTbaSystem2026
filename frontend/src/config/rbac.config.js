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

import { ROLES, ROLE_PERMISSIONS } from 'constants/rbac';
import { PERMISSIONS, hasPermission } from 'constants/permissions.constants';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Filter menu items based on user permissions
 * 
 * ROBUSTNESS REFACTOR (2026-02-06):
 * - Simplified recursive logic
 * - Normalized role checks (removes ROLE_ prefix)
 * - Prioritizes restrictedTo (Role exclusion) over permission inclusion
 * 
 * @param {Array} menuItems - Full menu structure
 * @param {Object} user - User object { roles, permissions }
 * @returns {Array} Filtered menu items
 */
export const filterMenuByPermissions = (menuItems, user) => {
  if (!user) return [];

  // Normalize roles for local check
  const userRoles = (user.roles || []).map(r => (typeof r === 'string' ? r : r.name).replace(/^ROLE_/, ''));
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  const filterRecursive = (items) => {
    return items
      .map(item => {
        // 1. ROLE RESTRICTION (Exclusion logic)
        // If restrictedTo exists, ONLY those roles can see the item (even SuperAdmin)
        const restrictedTo = (item.restrictedTo || []).map(r => r.replace(/^ROLE_/, ''));
        if (restrictedTo.length > 0) {
          const hasRequiredRole = userRoles.some(role => restrictedTo.includes(role));
          if (!hasRequiredRole) return null;
        }

        // 2. RECURSIVE FILTERING for children
        let filteredChildren = null;
        if (item.children) {
          filteredChildren = filterRecursive(item.children);
          // If a group/collapse has no visible children, hide the parent
          if (filteredChildren.length === 0) return null;
        }

        // 3. PERMISSION CHECK (Inclusion logic)
        // SuperAdmin bypasses permission checks (but not restrictedTo above)
        const canView = isSuperAdmin ||
          hasMenuPermission(user, item.id) ||
          (item.permission && hasPermission(user, item.permission));

        if (!canView) return null;

        return filteredChildren ? { ...item, children: filteredChildren } : item;
      })
      .filter(Boolean);
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

// Note: ROLE_PERMISSION_REFERENCE removed - consolidated into constants/rbac.js

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHECK IF USER HAS PERMISSION FOR MENU ITEM
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const hasMenuPermission = (user, menuId) => {
  // SUPER_ADMIN bypass (Robust prefix handling)
  const roles = (user?.roles || []).map(r => (typeof r === 'string' ? r : r.name).replace(/^ROLE_/, ''));
  if (roles.includes('SUPER_ADMIN')) {
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
  hasMenuPermission,
  filterMenuByPermissions,
  canAccessRoute
};
