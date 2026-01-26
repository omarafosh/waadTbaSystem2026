import { create } from 'zustand';
import {
  SystemRole,
  RolePrivilegeLevel,
  PermissionDomain,
  SUPER_ADMIN_ONLY_DOMAINS,
  RoleDomainAccess,
  getPrivilegeLevel,
  isSuperAdminRole,
  isInsuranceAdminOrHigher,
  hasAccessToDomain,
  isSuperAdminOnlyDomain,
  getAssignableRoles,
  canModifyRole
} from 'constants/rbac';

// ==============================|| RBAC STORE - ROLE-BASED ACCESS CONTROL ||============================== //

/**
 * Zustand store for RBAC (Role-Based Access Control)
 *
 * RBAC HARDENING (2026-01-13):
 * - Role hierarchy enforcement
 * - SUPER_ADMIN protection
 * - Domain-based access control
 * - Privilege escalation prevention
 */

const STORAGE_KEYS = {
  ROLES: 'userRoles',
  USER: 'userData',
  TOKEN: 'serviceToken',
  PERMISSIONS: 'userPermissions'
};

export const useRBACStore = create((set, get) => ({
  // State - SIMPLIFIED (no employerId)
  roles: [],
  permissions: [],
  user: null,
  isInitialized: false,

  // Actions
  setRoles: (roles) => {
    set({ roles });
    if (roles && roles.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
    }
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  setPermissions: (permissions) => {
    set({ permissions });
    if (permissions) {
      localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
    }
  },

  /**
   * Initialize RBAC state from backend user data or localStorage
   * Called after login or on app startup
   * SIMPLIFIED: No employer context initialization
   * @param {Object} userData - User data from backend (optional)
   */
  initialize: (userData = null) => {
    try {
      let roles = [];
      let user = null;
      let permissions = [];

      if (userData) {
        // Initialize from backend response (login)
        roles = userData.roles || [];
        user = userData;
        permissions = userData.permissions || [];

        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
      } else {
        // Initialize from localStorage (page refresh)
        const rolesStr = localStorage.getItem(STORAGE_KEYS.ROLES);
        roles = rolesStr ? JSON.parse(rolesStr) : [];

        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        user = userStr ? JSON.parse(userStr) : null;

        const permissionsStr = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
        permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
      }

      set({
        roles,
        permissions,
        user,
        isInitialized: true
      });

      console.log('🔒 RBAC Initialized:', { roles, user: user?.username || user?.name });
    } catch (error) {
      console.error('Failed to initialize RBAC:', error);
      set({ isInitialized: true });
    }
  },

  /**
   * Clear RBAC state (on logout)
   */
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ROLES);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
    // Also clean up legacy employer keys
    localStorage.removeItem('selectedEmployerId');
    localStorage.removeItem('selectedEmployerName');

    set({
      roles: [],
      permissions: [],
      user: null,
      isInitialized: false
    });
  },

  /**
   * Check if user has SUPER_ADMIN role (bypass all checks)
   * @returns {boolean}
   */
  isSuperAdmin: () => {
    const { roles } = get();
    return roles.includes('SUPER_ADMIN');
  },

  /**
   * Get user's primary role (simplified - each user has ONE role)
   * @returns {string|null}
   */
  getPrimaryRole: () => {
    const { roles } = get();
    return roles.length > 0 ? roles[0] : null;
  },

  /**
   * Check if user's role matches one of the allowed roles (simplified)
   * @param {string[]} allowedRoles - Array of allowed role names
   * @returns {boolean}
   */
  hasRole: (allowedRoles) => {
    const { roles } = get();
    const primaryRole = roles[0];

    // SUPER_ADMIN bypasses all checks
    if (primaryRole === 'SUPER_ADMIN') return true;

    // If no specific roles required, authenticated is enough
    if (!allowedRoles || allowedRoles.length === 0) return true;

    // Simple check: is primary role in allowed list?
    return allowedRoles.includes(primaryRole);
  },

  /**
   * Check if user is EMPLOYER role
   * @returns {boolean}
   */
  isEmployerRole: () => {
    const { roles } = get();
    return roles[0] === 'EMPLOYER';
  },

  // ============================================
  // RBAC Hardening - New Methods (2026-01-13)
  // ============================================

  /**
   * Check if user has access to a specific permission domain
   * @param {string} domain - Permission domain
   * @returns {boolean}
   */
  hasAccessToDomain: (domain) => {
    const { roles } = get();
    const primaryRole = roles[0];
    
    // SUPER_ADMIN has access to all domains
    if (primaryRole === SystemRole.SUPER_ADMIN) return true;
    
    // Check domain access
    return hasAccessToDomain(primaryRole, domain);
  },

  /**
   * Check if user can access RBAC management
   * SUPER_ADMIN ONLY
   * @returns {boolean}
   */
  canManageRbac: () => {
    const { roles } = get();
    return roles[0] === SystemRole.SUPER_ADMIN;
  },

  /**
   * Check if user can access system settings
   * SUPER_ADMIN ONLY
   * @returns {boolean}
   */
  canManageSystem: () => {
    const { roles } = get();
    return roles[0] === SystemRole.SUPER_ADMIN;
  },

  /**
   * Check if user can modify a target user with given role
   * @param {string} targetRole - Role of the target user
   * @returns {boolean}
   */
  canModifyUserWithRole: (targetRole) => {
    const { roles } = get();
    const primaryRole = roles[0];
    return canModifyRole(primaryRole, targetRole);
  },

  /**
   * Check if user can assign a specific role
   * @param {string} roleToAssign - Role to be assigned
   * @returns {boolean}
   */
  canAssignRole: (roleToAssign) => {
    const { roles } = get();
    const primaryRole = roles[0];
    const assignableRoles = getAssignableRoles(primaryRole);
    return assignableRoles.includes(roleToAssign);
  },

  /**
   * Get list of roles the user can assign
   * @returns {string[]}
   */
  getAssignableRoles: () => {
    const { roles } = get();
    const primaryRole = roles[0];
    return getAssignableRoles(primaryRole);
  },

  /**
   * Get user's privilege level
   * @returns {number}
   */
  getPrivilegeLevel: () => {
    const { roles } = get();
    const primaryRole = roles[0];
    return getPrivilegeLevel(primaryRole);
  },

  /**
   * Check if user is INSURANCE_ADMIN or higher
   * @returns {boolean}
   */
  isInsuranceAdminOrHigher: () => {
    const { roles } = get();
    const primaryRole = roles[0];
    return isInsuranceAdminOrHigher(primaryRole);
  }
}));

// ==============================|| EXPORTED HOOKS - SIMPLIFIED ||============================== //

/**
 * Hook to get user's primary role (simplified - each user has ONE role)
 * @returns {string|null}
 */
export const useRole = () => {
  const roles = useRBACStore((state) => state.roles);
  return roles.length > 0 ? roles[0] : null;
};

/**
 * Hook to get all user roles (for compatibility, but users should have ONE role)
 * @returns {string[]}
 */
export const useRoles = () => {
  return useRBACStore((state) => state.roles);
};

/**
 * Hook to get employer context - DEPRECATED / NO-OP
 * Kept for backward compatibility but returns empty/disabled state
 * @returns {{ employerId: null, setEmployerId: function, canSwitch: false }}
 * @deprecated Employer filtering removed - do not use
 */
export const useEmployerContext = () => {
  // NO-OP: Employer context disabled
  return {
    employerId: null,
    setEmployerId: () => console.warn('⚠️ setEmployerId is disabled - employer filtering removed'),
    canSwitch: false
  };
};

/**
 * Hook to get current user data
 * @returns {Object|null}
 */
export const useUser = () => {
  return useRBACStore((state) => state.user);
};

/**
 * Hook to get simplified RBAC state (no employer context)
 * @returns {Object}
 */
export const useRBAC = () => {
  const roles = useRBACStore((state) => state.roles);
  const user = useRBACStore((state) => state.user);
  const isInitialized = useRBACStore((state) => state.isInitialized);
  const hasRole = useRBACStore((state) => state.hasRole);
  const getPrimaryRole = useRBACStore((state) => state.getPrimaryRole);
  const isSuperAdmin = useRBACStore((state) => state.isSuperAdmin);
  const isEmployerRole = useRBACStore((state) => state.isEmployerRole);
  const permissions = useRBACStore((state) => state.permissions);
  
  // RBAC Hardening - new methods
  const canManageRbac = useRBACStore((state) => state.canManageRbac);
  const canManageSystem = useRBACStore((state) => state.canManageSystem);
  const canModifyUserWithRole = useRBACStore((state) => state.canModifyUserWithRole);
  const canAssignRole = useRBACStore((state) => state.canAssignRole);
  const getAssignableRolesFromStore = useRBACStore((state) => state.getAssignableRoles);
  const getPrivilegeLevelFromStore = useRBACStore((state) => state.getPrivilegeLevel);
  const isInsuranceAdminOrHigher = useRBACStore((state) => state.isInsuranceAdminOrHigher);
  const hasAccessToDomain = useRBACStore((state) => state.hasAccessToDomain);

  return {
    roles,
    permissions,
    primaryRole: getPrimaryRole(),
    user,
    isInitialized,
    hasRole,
    isSuperAdmin: isSuperAdmin(),
    isEmployerRole: isEmployerRole(),
    // RBAC Hardening
    canManageRbac: canManageRbac(),
    canManageSystem: canManageSystem(),
    canModifyUserWithRole,
    canAssignRole,
    getAssignableRoles: getAssignableRolesFromStore,
    getPrivilegeLevel: getPrivilegeLevelFromStore,
    isInsuranceAdminOrHigher: isInsuranceAdminOrHigher(),
    hasAccessToDomain,
    // Disabled - for compatibility only
    employerId: null,
    canSwitch: false
  };
};

export default useRBACStore;
