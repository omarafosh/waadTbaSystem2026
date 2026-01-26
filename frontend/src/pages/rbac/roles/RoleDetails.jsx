/**
 * RBAC Role Details Page - Phase D3 Step 2
 * Manages role permissions with toggle ON/OFF
 *
 * ⚠️ Key Features:
 * 1. Role info header
 * 2. Permissions grouped by module
 * 3. Toggle permissions ON/OFF with switches
 * 4. SUPER_ADMIN role is protected
 * 5. Optimistic UI updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// MUI Components
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  Button,
  FormGroup,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

// MUI Icons
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';

// Project Components
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import CircularLoader from 'components/CircularLoader';

// Services
import { rolesService, permissionsService } from 'services/rbac';

// Hooks
import useAuth from 'hooks/useAuth';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROTECTED_ROLES = ['SUPER_ADMIN'];

const PERMISSION_MODULES = {
  users: { label: 'المستخدمين', icon: PersonIcon, order: 1 },
  roles: { label: 'الأدوار', icon: AdminPanelSettingsIcon, order: 2 },
  permissions: { label: 'الصلاحيات', icon: SecurityIcon, order: 3 },
  members: { label: 'الأعضاء', icon: PersonIcon, order: 4 },
  employers: { label: 'جهات العمل', icon: PersonIcon, order: 5 },
  providers: { label: 'مقدمي الخدمات', icon: PersonIcon, order: 6 },
  claims: { label: 'المطالبات', icon: PersonIcon, order: 7 },
  policies: { label: 'الوثائق', icon: PersonIcon, order: 8 },
  pre_approvals: { label: 'الموافقات المسبقة', icon: PersonIcon, order: 9 },
  medical_services: { label: 'الخدمات الطبية', icon: PersonIcon, order: 10 },
  medical_packages: { label: 'الباقات الطبية', icon: PersonIcon, order: 11 },
  benefit_packages: { label: 'باقات المنافع', icon: PersonIcon, order: 12 },
  reports: { label: 'التقارير', icon: PersonIcon, order: 13 },
  settings: { label: 'الإعدادات', icon: PersonIcon, order: 14 },
  audit: { label: 'سجل التدقيق', icon: PersonIcon, order: 15 }
};

const ACTION_LABELS = {
  view: 'عرض',
  create: 'إنشاء',
  edit: 'تعديل',
  delete: 'حذف',
  manage: 'إدارة',
  assign_roles: 'تعيين أدوار',
  assign_permissions: 'تعيين صلاحيات',
  export: 'تصدير',
  import: 'استيراد',
  approve: 'موافقة',
  reject: 'رفض'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get role color based on role name
 */
const getRoleColor = (roleName) => {
  const roleColors = {
    SUPER_ADMIN: 'error',
    INSURANCE_ADMIN: 'warning',
    EMPLOYER_ADMIN: 'primary',
    REVIEWER: 'secondary',
    PROVIDER: 'info',
    USER: 'default'
  };
  return roleColors[roleName] || 'primary';
};

/**
 * Group permissions by module
 */
const groupPermissionsByModule = (permissions) => {
  const grouped = {};

  permissions.forEach((perm) => {
    const parts = (perm?.name || '').split('.');
    const module = parts[0] || 'other';

    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push(perm);
  });

  // Sort modules by order
  const sortedModules = Object.keys(grouped).sort((a, b) => {
    const orderA = PERMISSION_MODULES[a]?.order || 999;
    const orderB = PERMISSION_MODULES[b]?.order || 999;
    return orderA - orderB;
  });

  const sorted = {};
  sortedModules.forEach((key) => {
    sorted[key] = grouped[key];
  });

  return sorted;
};

// ============================================================================
// PERMISSION MODULE COMPONENT
// ============================================================================

const PermissionModule = ({ module, permissions, assignedIds, onToggle, isProtected, loading }) => {
  const moduleInfo = PERMISSION_MODULES[module] || { label: module, icon: SecurityIcon };
  const ModuleIcon = moduleInfo.icon;
  const activeCount = permissions.filter((p) => assignedIds.has(p?.id)).length;
  const allActive = activeCount === permissions.length;

  const handleToggleAll = () => {
    if (isProtected) return;
    const allIds = permissions.map((p) => p?.id);
    if (allActive) {
      // Remove all permissions in this module
      allIds.forEach((id) => {
        if (assignedIds.has(id)) {
          onToggle(id, false);
        }
      });
    } else {
      // Add all permissions in this module
      allIds.forEach((id) => {
        if (!assignedIds.has(id)) {
          onToggle(id, true);
        }
      });
    }
  };

  return (
    <Accordion defaultExpanded={activeCount > 0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%', pr: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ModuleIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="medium">
              {moduleInfo.label}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${activeCount} / ${permissions.length}`}
              size="small"
              color={allActive ? 'success' : activeCount > 0 ? 'warning' : 'default'}
            />
            <Tooltip title={isProtected ? 'دور محمي' : allActive ? 'إلغاء الكل' : 'تفعيل الكل'}>
              <span>
                <Switch
                  checked={allActive}
                  onChange={handleToggleAll}
                  disabled={isProtected || loading}
                  onClick={(e) => e.stopPropagation()}
                  size="small"
                />
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={1}>
          {permissions.map((permission) => {
            const isActive = assignedIds.has(permission?.id);
            const permName = permission?.name || '';
            const action = permName.split('.')[1] || permName;

            return (
              <Grid item xs={6} sm={4} md={3} key={permission?.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: isActive ? 'success.light' : 'grey.200',
                    borderRadius: 1,
                    bgcolor: isActive ? 'success.lighter' : 'background.paper',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {isActive ? <CheckCircleIcon color="success" fontSize="small" /> : <SecurityIcon color="disabled" fontSize="small" />}
                      <Typography variant="body2" color={isActive ? 'success.dark' : 'text.secondary'}>
                        {permission?.nameAr || ACTION_LABELS[action] || action}
                      </Typography>
                    </Stack>
                    <Tooltip title={isProtected ? 'لا يمكن تعديل صلاحيات الدور المحمي' : isActive ? 'إلغاء الصلاحية' : 'تفعيل الصلاحية'}>
                      <span>
                        <Switch
                          checked={isActive}
                          onChange={() => onToggle(permission?.id, !isActive)}
                          disabled={isProtected || loading}
                          size="small"
                        />
                      </span>
                    </Tooltip>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RoleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // ========================================
  // VALIDATE ID - Must be numeric
  // ========================================

  const numericId = Number(id);
  const isValidId = id && !isNaN(numericId) && numericId > 0;

  // State
  const [role, setRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(new Set()); // Track pending permission changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Derived state
  const isProtected = PROTECTED_ROLES.includes(role?.name);
  const assignedPermissionIds = useMemo(() => new Set((role?.permissions || []).map((p) => p?.id)), [role]);
  const groupedPermissions = useMemo(() => groupPermissionsByModule(allPermissions), [allPermissions]);

  // ========================================
  // DATA LOADING
  // ========================================

  const loadData = useCallback(async () => {
    // Guard: Don't load if ID is invalid
    if (!isValidId) return;

    try {
      setLoading(true);
      setError(null);

      const [roleRes, permsRes] = await Promise.all([rolesService.getRoleById(numericId), permissionsService.getAllPermissions()]);

      setRole(roleRes?.data?.data || roleRes?.data || null);
      setAllPermissions(permsRes?.data?.data || permsRes?.data || []);
    } catch (err) {
      console.error('[RoleDetails] Load error:', err);
      setError(err?.response?.data?.message || 'فشل تحميل بيانات الدور');
    } finally {
      setLoading(false);
    }
  }, [numericId, isValidId]);

  useEffect(() => {
    // Redirect to roles list if ID is invalid (e.g., "add" instead of number)
    if (!isValidId) {
      console.warn('[RoleDetails] Invalid role ID:', id);
      navigate('/rbac/roles', { replace: true });
      return;
    }
    loadData();
  }, [loadData, isValidId, id, navigate]);

  // ========================================
  // PERMISSION TOGGLE HANDLER
  // ========================================

  const handleTogglePermission = useCallback(
    async (permissionId, shouldAssign) => {
      if (isProtected || !isValidId) return;

      // Update local state immediately (optimistic update)
      setRole((prev) => {
        if (!prev) return prev;

        if (shouldAssign) {
          const permToAdd = allPermissions.find((p) => p?.id === permissionId);
          return {
            ...prev,
            permissions: [...(prev.permissions || []), permToAdd]
          };
        } else {
          return {
            ...prev,
            permissions: (prev.permissions || []).filter((p) => p?.id !== permissionId)
          };
        }
      });

      // Mark as pending change
      setPendingChanges((prev) => {
        const newSet = new Set(prev);
        newSet.add({ permissionId, shouldAssign });
        return newSet;
      });
      
      setHasUnsavedChanges(true);
    },
    [isValidId, isProtected, allPermissions]
  );

  // Save all pending changes
  const handleSaveChanges = useCallback(async () => {
    if (!hasUnsavedChanges || isProtected || !isValidId) return;

    try {
      setSaving(true);

      // Get all currently assigned permission IDs from the local state
      const allAssignedIds = (role?.permissions || []).map(p => p?.id);

      // Send the complete list of assigned permissions to the backend
      // The backend will replace all permissions with this list
      await rolesService.assignPermissions(numericId, allAssignedIds);

      // Clear pending changes
      setPendingChanges(new Set());
      setHasUnsavedChanges(false);

      // Refresh data to confirm
      await loadData();

      alert('تم حفظ التغييرات بنجاح');
    } catch (err) {
      console.error('[RoleDetails] Save changes error:', err);
      // Revert on error
      loadData();
      alert(err?.response?.data?.message || 'فشل حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  }, [numericId, isValidId, isProtected, role, hasUnsavedChanges, loadData]);

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularLoader />
      </Box>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================

  if (error) {
    return (
      <Box>
        <ModernPageHeader
          title="تفاصيل الدور"
          icon={AdminPanelSettingsIcon}
          breadcrumbs={[
            { label: 'الرئيسية', path: '/' },
            { label: 'الصلاحيات', path: '/rbac' },
            { label: 'الأدوار', path: '/rbac/roles' },
            { label: 'تفاصيل' }
          ]}
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================

  const activeCount = role?.permissions?.length || 0;
  const totalCount = allPermissions.length;

  return (
    <Box>
      {/* ====== PAGE HEADER ====== */}
      <ModernPageHeader
        title={role?.nameAr || role?.name || 'تفاصيل الدور'}
        subtitle="إدارة صلاحيات الدور"
        icon={AdminPanelSettingsIcon}
        breadcrumbs={[
          { label: 'الرئيسية', path: '/' },
          { label: 'الصلاحيات', path: '/rbac' },
          { label: 'الأدوار', path: '/rbac/roles' },
          { label: role?.nameAr || role?.name || 'تفاصيل' }
        ]}
        actions={
          <Stack direction="row" spacing={2}>
            {hasUnsavedChanges && !isProtected && (
              <Button 
                variant="contained" 
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={handleSaveChanges}
                disabled={saving}
                color="success"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            )}
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/rbac/roles')}>
              العودة للقائمة
            </Button>
          </Stack>
        }
      />

      {/* ====== ROLE INFO CARD ====== */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: `${getRoleColor(role?.name)}.main`,
              fontSize: '2rem'
            }}
          >
            <AdminPanelSettingsIcon sx={{ fontSize: 40 }} />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography variant="h5">{role?.nameAr || role?.name || '-'}</Typography>
              {isProtected && <Chip label="دور محمي" size="small" color="error" icon={<LockIcon sx={{ fontSize: '14px !important' }} />} />}
            </Stack>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {role?.description || role?.descriptionAr || '-'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`${activeCount} صلاحية من ${totalCount}`}
                color="primary"
                size="small"
                icon={<SecurityIcon sx={{ fontSize: '14px !important' }} />}
              />
              <Chip label={role?.active !== false ? 'نشط' : 'معطل'} color={role?.active !== false ? 'success' : 'default'} size="small" />
            </Stack>
          </Box>

          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" color="text.secondary" display="block">
              عدد المستخدمين
            </Typography>
            <Typography variant="h4" color="primary.main">
              {role?.usersCount || role?.users?.length || 0}
            </Typography>
          </Box>
        </Stack>
      </MainCard>

      {/* ====== PERMISSIONS CARD ====== */}
      <MainCard title="صلاحيات الدور">
        {/* Warning for protected roles */}
        {isProtected && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            هذا دور محمي من النظام ولا يمكن تعديل صلاحياته. دور المدير الأعلى يمتلك جميع الصلاحيات تلقائياً.
          </Alert>
        )}

        {/* Info alert */}
        {!isProtected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            قم بتفعيل أو تعطيل الصلاحيات لهذا الدور. {hasUnsavedChanges ? 'لديك تغييرات غير محفوظة - اضغط على زر "حفظ التغييرات" في الأعلى.' : 'التغييرات تُحفظ عند الضغط على زر الحفظ.'}
          </Alert>
        )}

        {/* Unsaved changes warning */}
        {hasUnsavedChanges && !isProtected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            لديك {pendingChanges.size} تغيير غير محفوظ. لا تنسَ الضغط على زر "حفظ التغييرات" في الأعلى.
          </Alert>
        )}

        {/* Saving indicator */}
        {saving && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <span>جاري الحفظ...</span>
            </Stack>
          </Alert>
        )}

        {/* Permission Modules */}
        <Box sx={{ mt: 2 }}>
          {Object.entries(groupedPermissions).map(([module, permissions]) => (
            <PermissionModule
              key={module}
              module={module}
              permissions={permissions}
              assignedIds={assignedPermissionIds}
              onToggle={handleTogglePermission}
              isProtected={isProtected}
              loading={saving}
            />
          ))}
        </Box>

        {Object.keys(groupedPermissions).length === 0 && <Alert severity="warning">لا توجد صلاحيات معرّفة في النظام</Alert>}
      </MainCard>
    </Box>
  );
};

export default RoleDetails;
