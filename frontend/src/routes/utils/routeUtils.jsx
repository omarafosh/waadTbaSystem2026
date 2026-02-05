import RouteGuard from '../RouteGuard';

/**
 * Creates a route object with integrated RBAC protection.
 * 
 * @param {Object} config - Route configuration
 * @param {string} config.path - Route path
 * @param {React.Component} config.element - Component to render (will be wrapped if roles/perms provided)
 * @param {string[]} [config.roles] - Array of allowed roles
 * @param {string} [config.permission] - Specific permission required
 * @param {Object[]} [config.children] - Child routes
 * @param {boolean} [config.index] - If true, this is an index route
 * @returns {Object} Route definition object
 */
export const createRoute = ({
    path,
    element: Component,
    roles = [],
    permission = null,
    permissions = [],
    children = [],
    index = false,
    requireAll = false
}) => {
    // If no protection needed, return simple route
    if (roles.length === 0 && !permission && permissions.length === 0) {
        const route = { element: <Component /> };
        if (index) route.index = true;
        else route.path = path;

        if (children.length > 0) route.children = children;
        return route;
    }

    // Wrap in RouteGuard
    const route = {
        element: (
            <RouteGuard
                allowedRoles={roles}
                requiredPermission={permission}
                permissions={permissions}
                requireAll={requireAll}
            >
                <Component />
            </RouteGuard>
        )
    };

    if (index) route.index = true;
    else route.path = path;

    if (children.length > 0) route.children = children;

    return route;
};

// Common Role Sets
export const ROLES = {
    ALL_ADMINS: ['SUPER_ADMIN', 'ADMIN'],
    ADMIN_EMPLOYER: ['ADMIN', 'EMPLOYER'],
    ADMIN_INSURANCE: ['ADMIN', 'INSURANCE_COMPANY'],
    REVIEWER_ACCESS: ['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER'],
    FULL_ACCESS: ['SUPER_ADMIN', 'ADMIN', 'INSURANCE_COMPANY', 'REVIEWER', 'EMPLOYER_ADMIN']
};
