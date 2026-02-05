package com.waad.tba.config;

import com.waad.tba.modules.rbac.entity.Permission;
import com.waad.tba.modules.rbac.entity.Role;
import com.waad.tba.modules.rbac.repository.PermissionRepository;
import com.waad.tba.modules.rbac.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * SUPER_ADMIN Permission Synchronizer
 * 
 * UPDATED 2026-01-05: Fixed lazy loading hang issue
 * - Uses findByNameWithPermissions() with FETCH JOIN
 * - ID-based comparison instead of entity comparison
 * - Better logging for debugging
 * 
 * This component runs at application startup to ensure that the SUPER_ADMIN role
 * has ALL permissions in the system. This guarantees that:
 * 
 * 1. SUPER_ADMIN always has every permission, even newly added ones
 * 2. No manual database updates are needed when new permissions are added
 * 3. The sync is idempotent - safe to run multiple times
 * 4. Missing permissions used in @PreAuthorize annotations are auto-created
 * 
 * CRITICAL BUSINESS RULE:
 * SUPER_ADMIN must NEVER be blocked by missing permissions in the database.
 * 
 * How it works:
 * 1. Runs after RbacDataInitializer (Order = 100)
 * 2. Creates any missing permissions that are used in the codebase
 * 3. Fetches all permissions from the database
 * 4. Fetches SUPER_ADMIN role
 * 5. Adds any missing permissions to SUPER_ADMIN
 * 6. Logs the result
 * 
 * @author TBA WAAD System
 * @version 1.2
 */
@Component
@Order(100) // Run after RbacDataInitializer (@Order(50))
@RequiredArgsConstructor
@Slf4j
public class SuperAdminPermissionSynchronizer implements CommandLineRunner {

    private static final String SUPER_ADMIN_ROLE_NAME = "SUPER_ADMIN";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    
    /**
     * List of all permission names used in @PreAuthorize annotations.
     * These MUST exist in the database for hasAuthority() to work.
     * 
     * AUDIT v1.2: Added all missing permissions found during RBAC audit
     */
    private static final List<String> REQUIRED_PERMISSIONS = Arrays.asList(
        // System permissions
        "MANAGE_SYSTEM_SETTINGS",
        
        // RBAC permissions (Unified)
        "MANAGE_USERS", "VIEW_USERS",
        "MANAGE_ROLES", "VIEW_ROLES", "ASSIGN_ROLES",
        "MANAGE_PERMISSIONS", "VIEW_PERMISSIONS", "ASSIGN_PERMISSIONS",
        
        // Provider permissions
        "MANAGE_PROVIDERS", "VIEW_PROVIDERS",
        
        // Provider Contract permissions (Unified)
        "MANAGE_PROVIDER_CONTRACTS", "VIEW_PROVIDER_CONTRACTS",
        
        // Insurance permissions
        "MANAGE_INSURANCE", "VIEW_INSURANCE",
        
        // Employer permissions
        "MANAGE_EMPLOYERS", "VIEW_EMPLOYERS",
        
        // Member permissions
        "MANAGE_MEMBERS", "VIEW_MEMBERS",
        "IMPORT_MEMBERS", // Unified
        
        // Claims permissions  
        "MANAGE_CLAIMS", "VIEW_CLAIMS", "CREATE_CLAIM", "UPDATE_CLAIM",
        "APPROVE_CLAIMS", "REJECT_CLAIMS", "VIEW_CLAIM_STATUS",
        
        // Settlement permissions
        "MANAGE_SETTLEMENTS", "VIEW_SETTLEMENTS",
        "CREATE_SETTLEMENT_BATCH", "CONFIRM_SETTLEMENT_BATCH",
        "PAY_SETTLEMENT_BATCH", "CANCEL_SETTLEMENT_BATCH",
        
        // Visit permissions
        "MANAGE_VISITS", "VIEW_VISITS",
        
        // Pre-auth permissions
        "MANAGE_PREAUTH", "VIEW_PREAUTH",
        "CREATE_PRE_AUTH", "VIEW_PRE_AUTH", "APPROVE_PRE_AUTH", "REJECT_PRE_AUTH", "CANCEL_PRE_AUTH",
        
        // Medical categories/services permissions
        "VIEW_MEDICAL_CATEGORIES", "MANAGE_MEDICAL_CATEGORIES",
        "VIEW_MEDICAL_SERVICES", "MANAGE_MEDICAL_SERVICES",
        
        // Medical packages permissions
        "VIEW_MEDICAL_PACKAGES", "MANAGE_MEDICAL_PACKAGES",
        
        // Reports permissions
        "VIEW_REPORTS", "MANAGE_REPORTS",
        
        // Company permissions
        "MANAGE_COMPANIES", "VIEW_COMPANIES",
        
        // Reviewer permissions
        "MANAGE_REVIEWER", "VIEW_REVIEWER",
        
        // Policy permissions
        "VIEW_BENEFIT_POLICIES", "MANAGE_BENEFIT_POLICIES",
        "VIEW_BENEFIT_PACKAGES", "MANAGE_BENEFIT_PACKAGES",
        
        // Eligibility permissions (Unified)
        "CHECK_ELIGIBILITY",
        
        // Basic access
        "VIEW_BASIC_DATA",
        
        // RBAC management
        "MANAGE_RBAC"
    );

    @Override
    @Transactional
    public void run(String... args) {
        log.info("╔════════════════════════════════════════════════════════════╗");
        log.info("║  SUPER_ADMIN Permission Synchronizer v1.2                  ║");
        log.info("╚════════════════════════════════════════════════════════════╝");

        try {
            // Step 1: Ensure all required permissions exist
            int permissionsCreated = ensureRequiredPermissions();
            if (permissionsCreated > 0) {
                log.info("📋 Created {} missing permissions in database", permissionsCreated);
            }
            
            // Step 2: Get SUPER_ADMIN role with permissions eagerly loaded (FIX 2026-01-05)
            log.debug("Loading SUPER_ADMIN role with permissions...");
            Optional<Role> superAdminOpt = roleRepository.findByNameWithPermissions(SUPER_ADMIN_ROLE_NAME);
            
            if (superAdminOpt.isEmpty()) {
                log.warn("⚠️ SUPER_ADMIN role not found! Skipping permission sync.");
                log.warn("   Please ensure RbacDataInitializer runs first.");
                return;
            }

            Role superAdmin = superAdminOpt.get();
            log.debug("✓ SUPER_ADMIN role loaded successfully");
            
            // Step 3: Get all permissions
            List<Permission> allPermissions = permissionRepository.findAll();
            log.debug("✓ Found {} total permissions in database", allPermissions.size());
            
            if (allPermissions.isEmpty()) {
                log.warn("⚠️ No permissions found in database! Skipping permission sync.");
                return;
            }

            // Step 4: Get current SUPER_ADMIN permissions (already loaded via FETCH JOIN)
            Set<Permission> currentPermissions = superAdmin.getPermissions();
            if (currentPermissions == null) {
                currentPermissions = new HashSet<>();
                superAdmin.setPermissions(currentPermissions);
            }
            log.debug("✓ Current SUPER_ADMIN has {} permissions", currentPermissions.size());

            // Step 5: Find missing permissions using ID-based comparison (stable)
            Set<Long> currentPermissionIds = currentPermissions.stream()
                    .map(Permission::getId)
                    .collect(Collectors.toSet());
            
            List<Permission> missingPermissions = allPermissions.stream()
                    .filter(p -> !currentPermissionIds.contains(p.getId()))
                    .collect(Collectors.toList());
            
            log.debug("✓ Found {} missing permissions", missingPermissions.size());

            // Step 6: Add missing permissions if any
            if (!missingPermissions.isEmpty()) {
                log.info("📋 Adding {} missing permissions to SUPER_ADMIN role...", missingPermissions.size());
                
                for (Permission permission : missingPermissions) {
                    log.debug("   ➕ Adding permission: {}", permission.getName());
                }
                
                // Add missing permissions
                currentPermissions.addAll(missingPermissions);
                superAdmin.setPermissions(currentPermissions);
                roleRepository.save(superAdmin);
                
                log.info("✅ Successfully added {} permissions to SUPER_ADMIN", missingPermissions.size());
            }

            // Step 7: Log final status
            int totalPermissions = allPermissions.size();
            int superAdminPermissions = superAdmin.getPermissions().size();
            
            log.info("╔════════════════════════════════════════════════════════════╗");
            log.info("║  SUPER_ADMIN permissions verified: {} / {} assigned         ", 
                    String.format("%3d", superAdminPermissions), 
                    String.format("%3d", totalPermissions));
            log.info("║                                                            ║");
            if (superAdminPermissions == totalPermissions) {
                log.info("║  ✅ SUPER_ADMIN has ALL permissions - Full system access   ║");
            } else {
                log.warn("║  ⚠️ SUPER_ADMIN missing some permissions!                  ║");
            }
            log.info("╚════════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("❌ Failed to sync SUPER_ADMIN permissions: {}", e.getMessage(), e);
            // Don't throw - allow application to start even if sync fails
            // The code-level bypass will still work
        }
    }
    
    /**
     * Ensure all required permissions exist in the database.
     * Creates any missing permissions.
     * 
     * @return Number of permissions created
     */
    private int ensureRequiredPermissions() {
        int created = 0;
        
        for (String permissionName : REQUIRED_PERMISSIONS) {
            Optional<Permission> existing = permissionRepository.findByName(permissionName);
            
            if (existing.isEmpty()) {
                Permission newPermission = Permission.builder()
                        .name(permissionName)
                        .description("Auto-created permission for " + permissionName)
                        .build();
                permissionRepository.save(newPermission);
                created++;
                log.debug("   ➕ Created permission: {}", permissionName);
            }
        }
        
        return created;
    }
}
