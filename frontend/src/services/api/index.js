// ==============================|| TBA API SERVICES - BARREL EXPORT ||============================== //

// NOTE: All services now use axiosClient from 'utils/axios' directly
// No need to export apiClient wrapper - removed to prevent double unwrapping

export { default as claimsService } from './claims.service';
export { default as dashboardService } from './dashboard.service';
export { default as employersService } from './employers.service';
export { default as membersService } from './members.service';
export { default as reviewersService } from './reviewers.service';
export { default as visitsService } from './visits.service';
export { default as preApprovalsService } from './pre-approvals.service';
export * as medicalServicesService from './medical-services.service';
export * as medicalCategoriesService from './medical-categories.service';
export * as medicalPackagesService from './medical-packages.service';
export * as benefitPackagesService from './benefit-packages.service';
export { default as providersService } from './providers.service';
export { default as settlementService } from './settlement.service';
