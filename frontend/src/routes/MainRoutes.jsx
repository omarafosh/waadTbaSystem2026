import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import MainLayout from 'layout/Dashboard';
import RouteGuard from './RouteGuard';

// Contexts - Phase D2.3 Table Refresh
import { TableRefreshLayout, TableRefreshProvider } from 'contexts/TableRefreshContext';

// ==============================|| LAZY LOADING - DASHBOARD ||============================== //

const Dashboard = Loadable(lazy(() => import('pages/dashboard')));

// ==============================|| LAZY LOADING - MEMBERS (UNIFIED ARCHITECTURE) ||============================== //
// 🆕 Unified Members Architecture - Self-referencing Member entity (Principal + Dependents)
// Replaces legacy Member + FamilyMember anti-pattern

const UnifiedMembersList = Loadable(lazy(() => import('pages/members/UnifiedMembersList')));
const UnifiedMemberCreate = Loadable(lazy(() => import('pages/members/UnifiedMemberCreate')));
const UnifiedMemberView = Loadable(lazy(() => import('pages/members/UnifiedMemberView')));
const UnifiedMemberEdit = Loadable(lazy(() => import('pages/members/UnifiedMemberEdit')));
const AddDependent = Loadable(lazy(() => import('pages/members/AddDependent')));
const EligibilityCheck = Loadable(lazy(() => import('pages/members/EligibilityCheck')));
const EligibilityCheckPage = Loadable(lazy(() => import('pages/eligibility/EligibilityCheckPage')));

// ==============================|| LAZY LOADING - EMPLOYERS ||============================== //

const EmployersList = Loadable(lazy(() => import('pages/employers/EmployersList')));
const EmployerCreate = Loadable(lazy(() => import('pages/employers/EmployerCreate')));
const EmployerEdit = Loadable(lazy(() => import('pages/employers/EmployerEdit')));
const EmployerView = Loadable(lazy(() => import('pages/employers/EmployerView')));

// ==============================|| LAZY LOADING - EMPLOYER CONTRACTS ||============================== //

const EmployerContracts = Loadable(lazy(() => import('pages/employers/EmployerContracts')));
const EmployerContractDetails = Loadable(lazy(() => import('pages/employers/EmployerContractDetails')));

// ==============================|| LAZY LOADING - CLAIMS ||============================== //

const ClaimsList = Loadable(lazy(() => import('pages/claims/ClaimsList')));
const ClaimCreate = Loadable(lazy(() => import('pages/claims/ClaimCreate')));
const ClaimEdit = Loadable(lazy(() => import('pages/claims/ClaimEdit')));
const ClaimView = Loadable(lazy(() => import('pages/claims/ClaimView')));
// Professional Claims Inbox with advanced filters and statistics
const ClaimsInbox = Loadable(lazy(() => import('pages/claims/ClaimsInboxPro')));
const SettlementInbox = Loadable(lazy(() => import('pages/claims/SettlementInbox')));

// ==============================|| LAZY LOADING - SETTLEMENT (NEW) ||============================== //

const SettlementBatchesList = Loadable(lazy(() => import('pages/settlement/SettlementBatchesList')));
const CreateSettlementBatch = Loadable(lazy(() => import('pages/settlement/CreateSettlementBatch')));
const SettlementBatchView = Loadable(lazy(() => import('pages/settlement/SettlementBatchView')));
const ProviderAccountsList = Loadable(lazy(() => import('pages/settlement/ProviderAccountsList')));


// ==============================|| LAZY LOADING - PROVIDERS ||============================== //

const ProvidersList = Loadable(lazy(() => import('pages/providers/ProvidersList')));
const ProviderCreate = Loadable(lazy(() => import('pages/providers/ProviderCreate')));
const ProviderEdit = Loadable(lazy(() => import('pages/providers/ProviderEdit')));
const ProviderView = Loadable(lazy(() => import('pages/providers/ProviderView')));

// ==============================|| LAZY LOADING - PROVIDER CONTRACTS ||============================== //

const ProviderContractsList = Loadable(lazy(() => import('pages/provider-contracts')));
const ProviderContractView = Loadable(lazy(() => import('pages/provider-contracts/ProviderContractView')));
const ProviderContractCreate = Loadable(lazy(() => import('pages/provider-contracts/ProviderContractCreate')));

// ==============================|| LAZY LOADING - VISITS ||============================== //

const VisitsList = Loadable(lazy(() => import('pages/visits/VisitsList')));
const VisitCreate = Loadable(lazy(() => import('pages/visits/VisitCreate')));
const VisitEdit = Loadable(lazy(() => import('pages/visits/VisitEdit')));
const VisitView = Loadable(lazy(() => import('pages/visits/VisitView')));

// ==============================|| LAZY LOADING - PROVIDER PORTAL ||============================== //

const ProviderEligibilityCheck = Loadable(lazy(() => import('pages/provider/ProviderEligibilityCheck')));
const ProviderClaimsSubmission = Loadable(lazy(() => import('pages/provider/ProviderClaimsSubmission')));
const ProviderVisitLog = Loadable(lazy(() => import('pages/provider/ProviderVisitLog')));
const ProviderPreApprovalSubmission = Loadable(lazy(() => import('pages/provider/ProviderPreApprovalSubmission')));

// ==============================|| POLICIES MODULE REMOVED ||============================== //
// Policy module deleted - NO Policy concept in backend. Use BenefitPolicy only.

// ==============================|| LAZY LOADING - PRE-APPROVALS ||============================== //

const PreApprovalsList = Loadable(lazy(() => import('pages/pre-approvals/PreApprovalsList')));
const PreApprovalCreate = Loadable(lazy(() => import('pages/pre-approvals/PreApprovalCreate')));
const PreApprovalEdit = Loadable(lazy(() => import('pages/pre-approvals/PreApprovalEdit')));
const PreApprovalView = Loadable(lazy(() => import('pages/pre-approvals/PreApprovalView')));
// Professional Pre-Approvals Inbox with advanced filters and statistics
const PreApprovalsInbox = Loadable(lazy(() => import('pages/pre-approvals/PreApprovalsInboxPro')));
const PreAuthAuditPage = Loadable(lazy(() => import('pages/pre-approvals/PreAuthAuditPage')));
const PreAuthDashboard = Loadable(lazy(() => import('pages/pre-approvals/PreAuthDashboard')));

// ==============================|| LAZY LOADING - APPROVALS DASHBOARD ||============================== //

// Unified Approvals Dashboard (Restored & Corrected)
const ApprovalsDashboard = Loadable(lazy(() => import('pages/approvals/ApprovalsDashboard')));

// ==============================|| LAZY LOADING - BENEFIT PACKAGES ||============================== //

const BenefitPackagesList = Loadable(lazy(() => import('pages/benefit-packages/BenefitPackagesList')));
const BenefitPackageCreate = Loadable(lazy(() => import('pages/benefit-packages/BenefitPackageCreate')));
const BenefitPackageEdit = Loadable(lazy(() => import('pages/benefit-packages/BenefitPackageEdit')));
const BenefitPackageView = Loadable(lazy(() => import('pages/benefit-packages/BenefitPackageView')));

// ==============================|| LAZY LOADING - BENEFIT POLICIES ||============================== //

const BenefitPoliciesList = Loadable(lazy(() => import('pages/benefit-policies/BenefitPoliciesList')));
const BenefitPolicyView = Loadable(lazy(() => import('pages/benefit-policies/BenefitPolicyView')));
const BenefitPolicyCreate = Loadable(lazy(() => import('pages/benefit-policies/BenefitPolicyCreate')));
const BenefitPolicyEdit = Loadable(lazy(() => import('pages/benefit-policies/BenefitPolicyEdit')));

// ==============================|| LAZY LOADING - MEDICAL SERVICES ||============================== //

const MedicalServicesList = Loadable(lazy(() => import('pages/medical-services/MedicalServicesList')));
const MedicalServiceCreate = Loadable(lazy(() => import('pages/medical-services/MedicalServiceCreate')));
const MedicalServiceEdit = Loadable(lazy(() => import('pages/medical-services/MedicalServiceEdit')));
const MedicalServiceView = Loadable(lazy(() => import('pages/medical-services/MedicalServiceView')));

// ==============================|| LAZY LOADING - MEDICAL CATEGORIES ||============================== //

const MedicalCategoriesList = Loadable(lazy(() => import('pages/medical-categories/MedicalCategoriesList')));
const MedicalCategoryCreate = Loadable(lazy(() => import('pages/medical-categories/MedicalCategoryCreate')));
const MedicalCategoryEdit = Loadable(lazy(() => import('pages/medical-categories/MedicalCategoryEdit')));
const MedicalCategoryView = Loadable(lazy(() => import('pages/medical-categories/MedicalCategoryView')));

// ==============================|| LAZY LOADING - DOCUMENTS ||============================== //

const DocumentsLibrary = Loadable(lazy(() => import('pages/documents/DocumentsLibrary')));

// ==============================|| LAZY LOADING - UNDER DEVELOPMENT ||============================== //

const UnderDevelopment = Loadable(lazy(() => import('pages/under-development')));

// ==============================|| LAZY LOADING - MEDICAL PACKAGES ||============================== //

const MedicalPackagesList = Loadable(lazy(() => import('pages/medical-packages')));
const MedicalPackageCreate = Loadable(lazy(() => import('pages/medical-packages/MedicalPackageCreate')));
const MedicalPackageEdit = Loadable(lazy(() => import('pages/medical-packages/MedicalPackageEdit')));
const MedicalPackageView = Loadable(lazy(() => import('pages/medical-packages/MedicalPackageView')));

// ==============================|| LAZY LOADING - COMPANIES ||============================== //

const CompaniesList = Loadable(lazy(() => import('pages/companies')));

// ==============================|| LAZY LOADING - RBAC ||============================== //

const RbacDashboard = Loadable(lazy(() => import('pages/rbac')));
const RbacUsersList = Loadable(lazy(() => import('pages/rbac/users')));
const RbacUserDetails = Loadable(lazy(() => import('pages/rbac/users/UserDetails')));
const RbacUserCreate = Loadable(lazy(() => import('pages/rbac/users/UserCreate')));
const RbacUserEdit = Loadable(lazy(() => import('pages/rbac/users/UserEdit')));
const RbacRolesList = Loadable(lazy(() => import('pages/rbac/roles')));
const RbacRoleDetails = Loadable(lazy(() => import('pages/rbac/roles/RoleDetails')));

// ==============================|| LAZY LOADING - REVIEWER COMPANIES ||============================== //

const ReviewerCompaniesList = Loadable(lazy(() => import('pages/reviewer-companies')));

// ==============================|| LAZY LOADING - ADMIN ||============================== //

const AdminCompaniesList = Loadable(lazy(() => import('pages/admin/companies')));
const AdminRolesList = Loadable(lazy(() => import('pages/admin/roles')));

// ==============================|| LAZY LOADING - SETTINGS ||============================== //

const Settings = Loadable(lazy(() => import('pages/settings')));

const CompanySettings = Loadable(lazy(() => import('pages/settings/company')));

// ==============================|| LAZY LOADING - PROFILE ||============================== //

const ProfileOverview = Loadable(lazy(() => import('pages/profile/ProfileOverview')));
const AccountSettings = Loadable(lazy(() => import('pages/profile/AccountSettings')));

// ==============================|| LAZY LOADING - AUDIT ||============================== //

const AuditLog = Loadable(lazy(() => import('pages/audit')));

// ==============================|| LAZY LOADING - REPORTS ||============================== //

const ReportsPage = Loadable(lazy(() => import('pages/reports')));
const EmployerDashboard = Loadable(lazy(() => import('pages/reports/employer-dashboard')));
// ProviderDashboard REMOVED (2026-01-14) - No business value, Provider role restricted
const ClaimsReport = Loadable(lazy(() => import('pages/reports/claims')));
const PreApprovalsReport = Loadable(lazy(() => import('pages/reports/pre-approvals')));
const VisitsReport = Loadable(lazy(() => import('pages/reports/visits')));
const BenefitPolicyReport = Loadable(lazy(() => import('pages/reports/benefit-policy')));
const BeneficiariesReports = Loadable(lazy(() => import('pages/reports/BeneficiariesReports')));
const FinancialReports = Loadable(lazy(() => import('pages/reports/FinancialReports')));
const ComingSoonReport = Loadable(lazy(() => import('pages/reports/ComingSoonReport')));

// ==============================|| LAZY LOADING - ERROR PAGES ||============================== //

const NoAccess = Loadable(lazy(() => import('pages/errors/NoAccess')));
const Error403 = Loadable(lazy(() => import('pages/errors/Forbidden403')));
const Error404 = Loadable(lazy(() => import('pages/errors/NotFound404')));
const Error500 = Loadable(lazy(() => import('pages/errors/ServerError500')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    // Dashboard
    {
      path: 'dashboard',
      element: (
        <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
          <Dashboard />
        </RouteGuard>
      )
    },

    // Members Module - Unified Architecture (Principal + Dependents in same table)
    {
      path: 'members',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <UnifiedMembersList />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <UnifiedMemberCreate />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <UnifiedMemberView />
            </RouteGuard>
          )
        },
        {
          path: ':id/edit',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <UnifiedMemberEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id/add-dependent',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <AddDependent />
            </RouteGuard>
          )
        },
        {
          path: 'eligibility',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER', 'PROVIDER']}>
              <EligibilityCheck />
            </RouteGuard>
          )
        }
      ]
    },

    // Employers Module
    {
      path: 'employers',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <EmployersList />
            </RouteGuard>
          )
        },
        {
          path: 'create',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <EmployerCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <EmployerEdit />
            </RouteGuard>
          )
        },
        {
          path: 'contracts',
          element: (
            <RouteGuard requiredPermission="benefit_policies.view">
              <EmployerContracts />
            </RouteGuard>
          )
        },
        {
          path: 'contracts/:id',
          element: (
            <RouteGuard requiredPermission="benefit_policies.view">
              <EmployerContractDetails />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <EmployerView />
            </RouteGuard>
          )
        }
      ]
    },


    // Approvals Dashboard (Unified)
    {
      path: 'approvals',
      children: [
        {
          path: 'dashboard',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'REVIEWER', 'INSURANCE_COMPANY']}>
              <ApprovalsDashboard />
            </RouteGuard>
          )
        }
      ]
    },

    // Claims Module
    {
      path: 'claims',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER', 'REVIEWER']}>
              <ClaimsList />
            </RouteGuard>
          )
        },
        {
          path: 'inbox',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'REVIEWER']}>
              <ClaimsInbox />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <ClaimCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <ClaimEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER', 'REVIEWER']}>
              <ClaimView />
            </RouteGuard>
          )
        }
      ]
    },

    // Settlement Module (New)
    {
      path: 'settlement',
      children: [
        {
          path: 'batches',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'FINANCE', 'INSURANCE_ADMIN']}>
              <SettlementBatchesList />
            </RouteGuard>
          )
        },
        {
          path: 'batches/create',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'FINANCE', 'INSURANCE_ADMIN']}>
              <CreateSettlementBatch />
            </RouteGuard>
          )
        },
        {
          path: 'batches/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'FINANCE', 'INSURANCE_ADMIN']}>
              <SettlementBatchView />
            </RouteGuard>
          )
        },
        {
          path: 'accounts',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'FINANCE', 'INSURANCE_ADMIN']}>
              <ProviderAccountsList />
            </RouteGuard>
          )
        }
      ]
    },

    // Providers Module
    {
      path: 'providers',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <ProvidersList />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <ProviderCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <ProviderEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <ProviderView />
            </RouteGuard>
          )
        }
      ]
    },

    // Provider Contracts Module
    {
      path: 'provider-contracts',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <ProviderContractsList />
            </RouteGuard>
          )
        },
        {
          path: 'create',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <ProviderContractCreate />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <ProviderContractView />
            </RouteGuard>
          )
        }
      ]
    },

    // Visits Module
    {
      path: 'visits',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'REVIEWER', 'PROVIDER']}>
              <VisitsList />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['ADMIN']}>
              <VisitCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN']}>
              <VisitEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'REVIEWER']}>
              <VisitView />
            </RouteGuard>
          )
        }
      ]
    },

    // NOTE: Policies module REMOVED - Use BenefitPolicy only (no Policy concept in backend)

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔒 PRE-APPROVALS MODULE - RBAC-Protected Routes
    // Roles: INSURANCE_ADMIN, REVIEWER, PROVIDER (own records)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      path: 'pre-approvals',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['INSURANCE_ADMIN', 'REVIEWER', 'PROVIDER']}>
              <PreApprovalsList />
            </RouteGuard>
          )
        },
        {
          path: 'dashboard',
          element: (
            <RouteGuard allowedRoles={['INSURANCE_ADMIN', 'REVIEWER']}>
              <PreAuthDashboard />
            </RouteGuard>
          )
        },
        {
          path: 'inbox',
          element: (
            <RouteGuard allowedRoles={['INSURANCE_ADMIN', 'REVIEWER']}>
              <PreApprovalsInbox />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['INSURANCE_ADMIN', 'EMPLOYER_ADMIN', 'PROVIDER']}>
              <PreApprovalCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['INSURANCE_ADMIN', 'REVIEWER']}>
              <PreApprovalEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['INSURANCE_ADMIN', 'REVIEWER', 'PROVIDER']}>
              <PreApprovalView />
            </RouteGuard>
          )
        },
        {
          path: ':id/audit',
          element: (
            <RouteGuard allowedRoles={['INSURANCE_ADMIN', 'REVIEWER']}>
              <PreAuthAuditPage />
            </RouteGuard>
          )
        }
      ]
    },

    // NOTE: Benefit Packages main routes are defined below (line ~674)
    // This section intentionally left empty to avoid duplicate route

    // Medical Services Module - Wrapped with TableRefreshLayout (Phase D2.3)
    {
      path: 'medical-services',
      element: <TableRefreshLayout />,
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalServicesList />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalServiceCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalServiceEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <MedicalServiceView />
            </RouteGuard>
          )
        }
      ]
    },

    // Medical Categories Module - Wrapped with TableRefreshLayout (Phase D2.4)
    {
      path: 'medical-categories',
      element: <TableRefreshLayout />,
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalCategoriesList />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalCategoryCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalCategoryEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <MedicalCategoryView />
            </RouteGuard>
          )
        }
      ]
    },

    // Medical Packages Module
    {
      path: 'medical-packages',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <MedicalPackagesList />
            </RouteGuard>
          )
        },
        {
          path: 'add',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalPackageCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <MedicalPackageEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <MedicalPackageView />
            </RouteGuard>
          )
        }
      ]
    },

    // Benefit Packages Module - Wrapped with TableRefreshLayout
    {
      path: 'benefit-packages',
      element: <TableRefreshLayout />,
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <BenefitPackagesList />
            </RouteGuard>
          )
        },
        {
          path: 'create',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <BenefitPackageCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <BenefitPackageEdit />
            </RouteGuard>
          )
        },
        {
          path: 'view/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <BenefitPackageView />
            </RouteGuard>
          )
        }
      ]
    },

    // Benefit Policies Module (NEW)
    {
      path: 'benefit-policies',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'EMPLOYER']}>
              <BenefitPoliciesList />
            </RouteGuard>
          )
        },
        {
          path: 'create',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <BenefitPolicyCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <BenefitPolicyEdit />
            </RouteGuard>
          )
        },
        {
          path: ':id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'EMPLOYER']}>
              <BenefitPolicyView />
            </RouteGuard>
          )
        }
      ]
    },

    // Eligibility Check Module (Unified - Card Number & Barcode Only)
    {
      path: 'eligibility',
      element: (
        <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER', 'EMPLOYER', 'PROVIDER']}>
          <EligibilityCheckPage />
        </RouteGuard>
      )
    },

    // Provider Portal Module (Healthcare Provider Interface)
    {
      path: 'provider',
      children: [
        {
          path: 'eligibility-check',
          element: (
            <RouteGuard allowedRoles={['PROVIDER', 'SUPER_ADMIN', 'INSURANCE_ADMIN']}>
              <ProviderEligibilityCheck />
            </RouteGuard>
          )
        },
        {
          path: 'visits',
          element: (
            <RouteGuard allowedRoles={['PROVIDER', 'SUPER_ADMIN', 'INSURANCE_ADMIN']}>
              <ProviderVisitLog />
            </RouteGuard>
          )
        },
        {
          path: 'claims/submit',
          element: (
            <RouteGuard allowedRoles={['PROVIDER', 'SUPER_ADMIN', 'INSURANCE_ADMIN']}>
              <ProviderClaimsSubmission />
            </RouteGuard>
          )
        },
        {
          path: 'pre-approvals/submit',
          element: (
            <RouteGuard allowedRoles={['PROVIDER', 'SUPER_ADMIN', 'INSURANCE_ADMIN']}>
              <ProviderPreApprovalSubmission />
            </RouteGuard>
          )
        }
      ]
    },

    // Visits Module
    {
      path: 'visits',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <VisitsList />
            </RouteGuard>
          )
        },
        {
          path: 'create',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <VisitCreate />
            </RouteGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY']}>
              <VisitEdit />
            </RouteGuard>
          )
        },
        {
          path: 'view/:id',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
              <VisitView />
            </RouteGuard>
          )
        }
      ]
    },

    // Companies Module
    {
      path: 'companies',
      element: (
        <RouteGuard allowedRoles={['SUPER_ADMIN']}>
          <CompaniesList />
        </RouteGuard>
      )
    },

    // Reviewer Companies Module
    {
      path: 'reviewer-companies',
      element: (
        <RouteGuard allowedRoles={['ADMIN', 'INSURANCE_COMPANY', 'REVIEWER']}>
          <ReviewerCompaniesList />
        </RouteGuard>
      )
    },

    // Admin Module
    {
      path: 'admin',
      children: [
        {
          path: 'companies',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN']}>
              <AdminCompaniesList />
            </RouteGuard>
          )
        },
        {
          path: 'roles',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN']}>
              <AdminRolesList />
            </RouteGuard>
          )
        }
      ]
    },

    // RBAC Module
    {
      path: 'rbac',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <RbacDashboard />
            </RouteGuard>
          )
        },
        {
          path: 'users',
          children: [
            {
              path: '',
              element: (
                <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <RbacUsersList />
                </RouteGuard>
              )
            },
            {
              path: 'create',
              element: (
                <RouteGuard allowedRoles={['SUPER_ADMIN']}>
                  <RbacUserCreate />
                </RouteGuard>
              )
            },
            {
              path: ':id',
              element: (
                <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <RbacUserDetails />
                </RouteGuard>
              )
            },
            {
              path: ':id/edit',
              element: (
                <RouteGuard allowedRoles={['SUPER_ADMIN']}>
                  <RbacUserEdit />
                </RouteGuard>
              )
            }
          ]
        },
        {
          path: 'roles',
          children: [
            {
              path: '',
              element: (
                <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <RbacRolesList />
                </RouteGuard>
              )
            },
            {
              path: ':id',
              element: (
                <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <RbacRoleDetails />
                </RouteGuard>
              )
            }
          ]
        }
      ]
    },

    // Settings
    {
      path: 'settings',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'EMPLOYER']}>
              <Settings />
            </RouteGuard>
          )
        },
        {
          path: 'company',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <CompanySettings />
            </RouteGuard>
          )
        }
      ]
    },

    // Profile
    {
      path: 'profile',
      children: [
        {
          path: '',
          element: <ProfileOverview />
        },
        {
          path: 'account',
          element: <AccountSettings />
        }
      ]
    },

    // Reports Module
    {
      path: 'reports',
      children: [
        {
          path: '',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'SUPER_ADMIN', 'INSURANCE_COMPANY', 'EMPLOYER_ADMIN']}>
              <ReportsPage />
            </RouteGuard>
          )
        },
        {
          path: 'employer-dashboard',
          element: (
            <RouteGuard allowedRoles={['ADMIN', 'SUPER_ADMIN', 'EMPLOYER_ADMIN']}>
              <EmployerDashboard />
            </RouteGuard>
          )
        },
        // provider-dashboard REMOVED (2026-01-14) - No business value
        {
          path: 'claims',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'EMPLOYER_ADMIN', 'REVIEWER']}>
              <ClaimsReport />
            </RouteGuard>
          )
        },
        {
          path: 'pre-approvals',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'EMPLOYER_ADMIN', 'REVIEWER']}>
              <PreApprovalsReport />
            </RouteGuard>
          )
        },
        {
          path: 'visits',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'EMPLOYER_ADMIN', 'REVIEWER']}>
              <VisitsReport />
            </RouteGuard>
          )
        },
        {
          path: 'benefit-policy',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'EMPLOYER_ADMIN', 'REVIEWER']}>
              <BenefitPolicyReport />
            </RouteGuard>
          )
        },
        {
          path: 'beneficiaries',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'INSURANCE_COMPANY', 'EMPLOYER_ADMIN']}>
              <BeneficiariesReports />
            </RouteGuard>
          )
        },
        {
          path: 'financial',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FINANCE']}>
              <FinancialReports />
            </RouteGuard>
          )
        },
        {
          path: 'coming-soon/:reportId',
          element: (
            <RouteGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'INSURANCE_ADMIN', 'REVIEWER']}>
              <ComingSoonReport />
            </RouteGuard>
          )
        }
      ]
    },

    // Audit Log
    {
      path: 'audit',
      element: (
        <RouteGuard permissions={['VIEW_AUDIT_LOGS']} requireAll={false}>
          <TableRefreshProvider>
            <AuditLog />
          </TableRefreshProvider>
        </RouteGuard>
      )
    },

    // Under Development Placeholder
    {
      // Documents
      path: 'documents',
      element: (
        <RouteGuard permissions={['claims.view', 'pre_approvals.view']} requireAll={false}>
          <TableRefreshProvider>
            <DocumentsLibrary />
          </TableRefreshProvider>
        </RouteGuard>
      )
    },
    {
      path: 'under-development',
      element: <UnderDevelopment />
    },

    // Error Pages
    {
      path: '403',
      element: <NoAccess />
    },
    {
      path: 'forbidden',
      element: <Error403 />
    },
    {
      path: '404',
      element: <Error404 />
    },
    {
      path: '500',
      element: <Error500 />
    },
    {
      path: '*',
      element: <Error404 />
    }
  ]
};

export default MainRoutes;
