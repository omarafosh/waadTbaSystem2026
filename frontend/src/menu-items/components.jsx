// material-ui icons
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  LocalHospital as LocalHospitalIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as ReceiptLongIcon,
  Description as DescriptionIcon,
  PeopleAlt as PeopleAltIcon,
  MedicalServices as MedicalServicesIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Gavel as GavelIcon,
  CardGiftcard as CardGiftcardIcon,
  Inbox as InboxIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Policy as PolicyIcon,
  Handshake as HandshakeIcon,
  ManageAccounts as ManageAccountsIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  FactCheck as FactCheckIcon,
  AssignmentInd as AssignmentIndIcon,
  HowToReg as HowToRegIcon,
  PostAdd as PostAddIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Folder as FolderIcon,
  VpnKey as VpnKeyIcon,
  HelpOutline as HelperIcon
} from '@mui/icons-material';

// RBAC Configuration
import { filterMenuByPermissions } from 'config/rbac.config';

// ==============================|| RBAC MENU FILTERING ||============================== //

/**
 * Filter menu items based on user permissions (UNIFIED ARCHITECTURE)
 * @param {Array} menuItems - Full menu structure
 * @param {Array} userRoles - User's assigned roles
 * @param {Object} user - User object with permissions
 * @returns {Array} Filtered menu items
 */
export const filterMenuByRoles = (menuItems, userRoles = [], user = null) => {
  // If user object lacks permissions but roles exist, construct a minimal user for the filter
  const filteringUser = user || { roles: userRoles, permissions: [] };

  // Use the unified permission-based filtering
  return filterMenuByPermissions(menuItems, filteringUser);
};

// ==============================|| MENU ITEMS ||============================== //

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏥 PROFESSIONAL TPA SYSTEM - NAVIGATION MENU (2026 STANDARD)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DESIGN PHILOSOPHY:
 * ✅ Professional TPA Industry Standards
 * ✅ Clear separation: Implemented vs. Under Development
 * ✅ Future-proof structure (no breaking changes when adding features)
 * ✅ Role-based visibility (RBAC enforced)
 *
 * NAVIGATION STRUCTURE:
 *
 * 📊 Dashboard
 * 👥 Members
 * 🏢 Employers (Partners)
 * 🏥 Providers
 * 💰 Claims & Approvals
 * 📈 Reports
 * 📂 Documents (under development)
 * ⚙️ System Settings
 *
 * STATUS INDICATORS:
 * ✅ = Implemented and working
 * ⏳ = Under development (shows placeholder page)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const menuItem = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-dashboard',
    title: 'لوحة المعلومات',
    titleEn: 'Dashboard',
    type: 'group',
    children: [
      {
        id: 'dashboard',
        title: 'لوحة المعلومات الرئيسية',
        titleEn: 'Main Dashboard',
        type: 'item',
        url: '/dashboard',
        icon: DashboardIcon,
        breadcrumbs: false,
        chip: {
          label: '✅',
          color: 'success',
          size: 'small',
          variant: 'filled'
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 👥 MEMBERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-members',
    title: 'المستفيدين',
    titleEn: 'Insured',
    type: 'group',
    children: [
      {
        id: 'members',
        title: 'المستفيدين',
        titleEn: 'Insured',
        type: 'item',
        url: '/members',
        icon: PeopleAltIcon,
        breadcrumbs: false,
        chip: {
          label: '✅',
          color: 'success',
          size: 'small',
          variant: 'filled'
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏥 PROVIDER PORTAL (VISIT-CENTRIC FLOW 2026-01-14)
  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHITECTURAL RULE: No standalone Pre-Authorization access
  // Pre-Auth can ONLY be created from Visit Log
  {
    id: 'group-provider-portal',
    title: 'بوابة مقدم الخدمة',
    titleEn: 'Provider Portal',
    type: 'group',
    children: [
      {
        id: 'provider-portal',
        title: 'بوابة مقدم الخدمة',
        titleEn: 'Provider Portal',
        type: 'collapse',
        icon: LocalHospitalIcon,
        children: [
          {
            id: 'provider-eligibility-check',
            title: 'التحقق من الأهلية',
            titleEn: 'Eligibility Check',
            type: 'item',
            url: '/provider/eligibility-check',
            icon: HowToRegIcon,
            chip: {
              label: '1️⃣',
              color: 'primary',
              size: 'small'
            }
          },
          {
            id: 'provider-visit-log',
            title: 'سجل الزيارات',
            titleEn: 'Visit Log',
            type: 'item',
            url: '/provider/visits',
            icon: AssignmentIcon,
            chip: {
              label: '2️⃣',
              color: 'info',
              size: 'small'
            }
          },
          {
            id: 'provider-documents',
            title: 'المستندات',
            titleEn: 'Documents',
            type: 'item',
            url: '/provider/documents',
            icon: FolderIcon,
            chip: {
              label: '3️⃣',
              color: 'secondary',
              size: 'small'
            }
          }
          // NOTE (2026-01-14): Pre-Approvals menu item REMOVED
          // Per Visit-Centric Architecture: Pre-Auth can ONLY be created from Visit Log
          // This prevents standalone pre-authorization workflow
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏢 EMPLOYERS (PARTNERS)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-employers',
    title: 'جهات العمل',
    titleEn: 'Employers',
    type: 'group',
    children: [
      {
        id: 'employers',
        title: 'إدارة جهات العمل',
        titleEn: 'Employers Management',
        type: 'collapse',
        icon: BusinessIcon,
        children: [
          {
            id: 'employers-list',
            title: 'قائمة جهات العمل',
            titleEn: 'Employers List',
            type: 'item',
            url: '/employers',
            icon: FormatListBulletedIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'benefit-policies',
            title: 'وثائق التأمين',
            titleEn: 'Benefit Policies',
            type: 'item',
            url: '/benefit-policies',
            icon: PolicyIcon,
            permission: ['benefit_policies.view'],
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏥 PROVIDERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-providers',
    title: 'مقدمو الخدمات',
    titleEn: 'Providers',
    type: 'group',
    children: [
      {
        id: 'providers',
        title: 'إدارة مقدمي الخدمات',
        titleEn: 'Providers Management',
        type: 'collapse',
        icon: LocalHospitalIcon,
        children: [
          {
            id: 'providers-list',
            title: 'قائمة المقدمين',
            titleEn: 'Providers List',
            type: 'item',
            url: '/providers',
            icon: FormatListBulletedIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'provider-contracts',
            title: 'عقود مقدمي الخدمات',
            titleEn: 'Provider Contracts',
            type: 'item',
            url: '/provider-contracts',
            icon: HandshakeIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          }
          // REMOVED (2026-01-14): provider-network (used deleted provider-dashboard)
          // REMOVED (2026-01-14): provider-portal link (Provider Portal is NOT part of Provider Management)
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💰 CLAIMS & APPROVALS
  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE (2026-01-23): Reviewers/Insurance staff only REVIEW, they don't CREATE
  // Claims and Pre-Approvals are created ONLY by Providers via Visit Log
  {
    id: 'group-claims-approvals',
    title: 'المطالبات والموافقات',
    titleEn: 'Claims & Approvals',
    type: 'group',
    children: [
      {
        id: 'claims-approvals',
        title: 'مراجعة المطالبات والموافقات',
        titleEn: 'Review Claims & Approvals',
        type: 'collapse',
        icon: ReceiptIcon,
        children: [
          {
            id: 'claims-inbox',
            title: 'وارد المطالبات',
            titleEn: 'Claims Inbox',
            type: 'item',
            url: '/claims/inbox',
            icon: InboxIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'pre-approvals-inbox',
            title: 'وارد الموافقات المسبقة',
            titleEn: 'Pre-Approvals Inbox',
            type: 'item',
            url: '/pre-approvals/inbox',
            icon: InboxIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'unified-approvals-dashboard',
            title: 'لوحة الموافقات الموحدة',
            titleEn: 'Unified Approvals Dashboard',
            type: 'item',
            url: '/approvals/dashboard',
            icon: DashboardIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'settlement-inbox',
            title: 'صندوق التسويات المالية',
            titleEn: 'Settlement & Finance',
            type: 'item',
            url: '/claims/settlement',
            icon: PaymentIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          }
          // NOTE (2026-01-23): Removed 'pre-approvals' (list page) and 'claims' (history page)
          // Reviewers access everything through Inbox pages
          // No CREATE options - only Providers can create via Visit Log
          // NOTE (2026-01-23): Removed 'visits' - redundant (already in Reports section)
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💰 SETTLEMENT & FINANCE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-settlement',
    title: 'التسويات المالية',
    titleEn: 'Settlement & Finance',
    type: 'group',
    children: [
      {
        id: 'settlement',
        title: 'إدارة التسويات',
        titleEn: 'Settlement Management',
        type: 'collapse',
        icon: PaymentIcon,
        children: [
          {
            id: 'settlement-batches',
            title: 'دفعات التسوية',
            titleEn: 'Settlement Batches',
            type: 'item',
            url: '/settlement/batches',
            icon: ReceiptIcon,
            chip: {
              label: 'New',
              color: 'primary',
              size: 'small'
            }
          },
          {
            id: 'provider-accounts',
            title: 'حسابات مقدمي الخدمة',
            titleEn: 'Provider Accounts',
            type: 'item',
            url: '/settlement/accounts',
            icon: LocalHospitalIcon
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📈 REPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-reports',
    title: 'التقارير',
    titleEn: 'Reports',
    type: 'group',
    children: [
      {
        id: 'reports',
        title: 'مركز التقارير',
        titleEn: 'Reports Center',
        type: 'collapse',
        icon: AssessmentIcon,
        children: [
          {
            id: 'claims-report',
            title: 'تقارير المطالبات',
            titleEn: 'Claims Reports',
            type: 'item',
            url: '/reports/claims',
            icon: ReceiptIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'pre-approvals-report',
            title: 'تقارير الموافقات المسبقة',
            titleEn: 'Pre-Approvals Reports',
            type: 'item',
            url: '/reports/pre-approvals',
            icon: AssignmentIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'financial-reports',
            title: 'التقارير المالية',
            titleEn: 'Financial Reports',
            type: 'item',
            url: '/reports/financial',
            icon: PaymentIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'provider-pdf-reports',
            title: 'تقارير مقدمي الخدمة PDF',
            titleEn: 'Provider PDF Reports',
            type: 'item',
            url: '/reports/providers',
            icon: LocalHospitalIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'provider-settlement-reports',
            title: 'تقارير تسوية مقدمي الخدمة',
            titleEn: 'Provider Settlement Reports',
            type: 'item',
            url: '/reports/provider-settlement',
            icon: LocalHospitalIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'employer-reports',
            title: 'تقارير جهات العمل',
            titleEn: 'Employer Reports',
            type: 'item',
            url: '/reports/employer-dashboard',
            icon: BusinessIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'visits-report',
            title: 'تقارير الزيارات',
            titleEn: 'Visits Reports',
            type: 'item',
            url: '/reports/visits',
            icon: AssignmentIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'benefit-policy-report',
            title: 'تقارير وثائق التأمين',
            titleEn: 'Benefit Policy Reports',
            type: 'item',
            url: '/reports/benefit-policy',
            icon: PolicyIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'beneficiaries-report',
            title: 'تقارير المستفيدين',
            titleEn: 'Insured Reports',
            type: 'item',
            url: '/reports/beneficiaries',
            icon: PeopleAltIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'export-center',
            title: 'مركز التصدير (PDF / Excel)',
            titleEn: 'Export Center (PDF / Excel)',
            type: 'item',
            url: '/under-development',
            icon: DescriptionIcon,
            chip: {
              label: '⏳',
              color: 'warning',
              size: 'small'
            }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📂 DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-documents',
    title: 'الوثائق',
    titleEn: 'Documents',
    type: 'group',
    children: [
      {
        id: 'documents-library',
        title: 'مكتبة الوثائق',
        titleEn: 'Documents Library',
        type: 'item',
        url: '/documents',
        icon: DescriptionIcon,
        permission: ['claims.view', 'pre_approvals.view'],
        chip: {
          label: '✅',
          color: 'success',
          size: 'small'
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚙️ SYSTEM SETTINGS - إعدادات النظام
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'group-system-settings',
    title: 'إعدادات النظام',
    titleEn: 'System Settings',
    type: 'group',
    children: [
      // ────────────────────────────────────────────────────────────────────────
      // سجل التدقيق
      // ────────────────────────────────────────────────────────────────────────
      {
        id: 'audit',
        title: 'سجل التدقيق',
        titleEn: 'Audit Log',
        type: 'item',
        url: '/audit',
        icon: TimelineIcon,
        chip: {
          label: '✅',
          color: 'success',
          size: 'small',
          variant: 'outlined'
        }
      },
      // ────────────────────────────────────────────────────────────────────────
      // التصنيف الطبي
      // ────────────────────────────────────────────────────────────────────────
      {
        id: 'medical-taxonomy',
        title: 'التصنيف الطبي',
        titleEn: 'Medical Taxonomy',
        type: 'collapse',
        icon: MedicalServicesIcon,
        children: [
          {
            id: 'medical-categories',
            title: 'التصنيفات الطبية',
            titleEn: 'Medical Categories',
            type: 'item',
            url: '/medical-categories',
            icon: CategoryIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'medical-services',
            title: 'الخدمات الطبية',
            titleEn: 'Medical Services',
            type: 'item',
            url: '/medical-services',
            icon: MedicalServicesIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'medical-packages',
            title: 'الحزم الطبية',
            titleEn: 'Medical Packages',
            type: 'item',
            url: '/medical-packages',
            icon: InventoryIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          }
        ]
      },
      // ────────────────────────────────────────────────────────────────────────
      // إعدادات المؤسسة (Organization Settings with Users & Roles tabs)
      // ────────────────────────────────────────────────────────────────────────
      {
        id: 'organization-settings',
        title: 'إعدادات المؤسسة',
        titleEn: 'Organization Settings',
        type: 'collapse',
        icon: SettingsIcon,
        permission: ['settings.view'],
        children: [
          {
            id: 'company-settings',
            title: 'معلومات المؤسسة',
            titleEn: 'Organization Info',
            type: 'item',
            url: '/settings/company',
            icon: BusinessIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'users-management',
            title: 'إدارة المستخدمين',
            titleEn: 'Users Management',
            type: 'item',
            url: '/rbac/users',
            icon: ManageAccountsIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          },
          {
            id: 'roles-management',
            title: 'إدارة الأدوار',
            titleEn: 'Roles Management',
            type: 'item',
            url: '/rbac/roles',
            icon: SecurityIcon,
            chip: {
              label: '✅',
              color: 'success',
              size: 'small'
            }
          }
        ]
      }
    ]
  }
];

export default menuItem;
