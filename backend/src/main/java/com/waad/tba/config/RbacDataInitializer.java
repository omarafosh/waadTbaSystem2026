package com.waad.tba.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.waad.tba.modules.rbac.entity.Permission;
import com.waad.tba.modules.rbac.entity.Role;
import com.waad.tba.modules.rbac.entity.User;
import com.waad.tba.modules.rbac.repository.PermissionRepository;
import com.waad.tba.modules.rbac.repository.RoleRepository;
import com.waad.tba.modules.rbac.repository.UserRepository;
import com.waad.tba.security.AppPermission;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * RBAC Data Initializer - Clean Foundation (Version 2.0)
 * 
 * Initializes the complete RBAC system with:
 * - All permissions from AppPermission enum (27 permissions)
 * - 6 business-aligned roles:
 *   1. SUPER_ADMIN: Full system access
 *   2. INSURANCE_ADMIN: Insurance company administrator
 *   3. EMPLOYER_ADMIN: Employer company administrator
 *   4. REVIEWER: Medical claim reviewer
 *   5. PROVIDER: Healthcare provider
 *   6. USER: Basic read-only user
 * - Single superadmin user (superadmin@tba.sa / Admin@123)
 * 
 * Execution Order: Runs FIRST (@Order(50)) before SuperAdminPermissionSynchronizer (@Order(100))
 * 
 * @author TBA WAAD System
 * @version 2.1
 */
@Component
@Order(50) // Run BEFORE SuperAdminPermissionSynchronizer (which is @Order(100))
@RequiredArgsConstructor
@Slf4j
public class RbacDataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("╔════════════════════════════════════════════════════════════╗");
        log.info("║  RBAC Data Initializer - Clean Foundation v2.0             ║");
        log.info("╚════════════════════════════════════════════════════════════╝");
        
        try {
            // Step 1: Create all permissions from enum
            Map<String, Permission> permissionMap = ensureAllPermissions();
            log.info("✅ Step 1/3: Permissions initialized ({} total)", permissionMap.size());
            
            // Step 2: Create all roles with their permission mappings
            Map<String, Role> roleMap = ensureAllRoles(permissionMap);
            log.info("✅ Step 2/3: Roles initialized ({} total)", roleMap.size());
            
            // Step 3: Create superadmin user
            ensureSuperAdminUser(roleMap);
            log.info("✅ Step 3/3: Super Admin user initialized");
            
            log.info("╔════════════════════════════════════════════════════════════╗");
            log.info("║  RBAC Initialization Completed Successfully!               ║");
            log.info("║                                                            ║");
            log.info("║  Login Credentials:                                        ║");
            log.info("║  Username: superadmin                                      ║");
            log.info("║  Email:    superadmin@tba.sa                               ║");
            log.info("║  Password: Admin@123                                       ║");
            log.info("╚════════════════════════════════════════════════════════════╝");
            
        } catch (Exception e) {
            log.error("❌ RBAC initialization failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize RBAC system", e);
        }
    }

    /**
     * Step 1: Create all permissions from AppPermission enum.
     * Returns a map of permission name -> Permission entity for role assignment.
     * 100% Idempotent - checks existence before insert.
     */
    private Map<String, Permission> ensureAllPermissions() {
        log.info("📋 Initializing permissions from AppPermission enum...");
        
        Map<String, Permission> permissionMap = new HashMap<>();
        int created = 0;
        int skipped = 0;
        
        for (AppPermission appPerm : AppPermission.values()) {
            String permName = appPerm.getPermissionName();
            
            // Check if permission already exists
            Optional<Permission> existingPerm = permissionRepository.findByName(permName);
            
            if (existingPerm.isPresent()) {
                permissionMap.put(permName, existingPerm.get());
                skipped++;
                log.debug("   ⏭️  Skipping existing permission: {}", permName);
            } else {
                Permission newPerm = Permission.builder()
                        .name(permName)
                        .description(appPerm.getDescription() + " | " + appPerm.getDisplayNameAr())
                        .build();
                
                Permission saved = permissionRepository.save(newPerm);
                permissionMap.put(permName, saved);
                created++;
                log.debug("   ➕ Created permission: {}", permName);
            }
        }
        
        log.info("   📊 Permissions: {} created, {} skipped, {} total", created, skipped, permissionMap.size());
        return permissionMap;
    }

    /**
     * Step 2: Create all 6 business-aligned roles with their permission mappings.
     */
    private Map<String, Role> ensureAllRoles(Map<String, Permission> permissionMap) {
        log.info("👥 Initializing roles...");
        
        Map<String, Role> roleMap = new HashMap<>();
        
        // Role 1: SUPER_ADMIN - Full system access
        roleMap.put("SUPER_ADMIN", ensureRole(
                "SUPER_ADMIN",
                "المدير العام للنظام",
                "Full system administrator with all permissions",
                permissionMap,
                Arrays.asList(
                    // All permissions (37 total with granular pre-auth permissions)
                    "MANAGE_RBAC", "MANAGE_SYSTEM_SETTINGS",
                    "MANAGE_COMPANIES", "VIEW_COMPANIES",
                    "MANAGE_INSURANCE", "VIEW_INSURANCE",
                    "MANAGE_REVIEWER", "VIEW_REVIEWER",
                    "MANAGE_PROVIDERS", "VIEW_PROVIDERS",
                    "MANAGE_PROVIDER_CONTRACTS", "VIEW_PROVIDER_CONTRACTS",
                    "MANAGE_EMPLOYERS", "VIEW_EMPLOYERS",
                    "MANAGE_MEMBERS", "VIEW_MEMBERS",
                    "MANAGE_CLAIMS", "VIEW_CLAIMS", "CREATE_CLAIM", "UPDATE_CLAIM", 
                    "APPROVE_CLAIMS", "REJECT_CLAIMS", "VIEW_CLAIM_STATUS",
                    "MANAGE_VISITS", "VIEW_VISITS",
                    "MANAGE_PREAUTH", "VIEW_PREAUTH",
                    // Granular Pre-Auth Permissions
                    "VIEW_PRE_AUTH", "CREATE_PRE_AUTH", "UPDATE_PRE_AUTH",
                    "APPROVE_PRE_AUTH", "REJECT_PRE_AUTH", "CANCEL_PRE_AUTH", "DELETE_PRE_AUTH",
                    "MANAGE_REPORTS", "VIEW_REPORTS",
                    "VIEW_BASIC_DATA"
                )
        ));
        
        // Role 2: INSURANCE_ADMIN - Insurance company administrator
        // UPDATED 2026-01-05: Full system permissions (same as SUPER_ADMIN except MANAGE_RBAC)
        // MANAGE_RBAC is reserved for SUPER_ADMIN only (prevents deletion of SUPER_ADMIN)
        roleMap.put("INSURANCE_ADMIN", ensureRole(
                "INSURANCE_ADMIN",
                "مدير شركة التأمين",
                "Insurance company administrator with full system access",
                permissionMap,
                Arrays.asList(
                    // System Management (except MANAGE_RBAC - reserved for SUPER_ADMIN)
                    "MANAGE_SYSTEM_SETTINGS",
                    
                    // Company & Organization Management
                    "MANAGE_COMPANIES", "VIEW_COMPANIES",
                    "MANAGE_INSURANCE", "VIEW_INSURANCE",
                    "MANAGE_REVIEWER", "VIEW_REVIEWER",
                    
                    // Provider Management
                    "MANAGE_PROVIDERS", "VIEW_PROVIDERS",
                    "MANAGE_PROVIDER_CONTRACTS", "VIEW_PROVIDER_CONTRACTS",
                    
                    // Employer & Member Management
                    "MANAGE_EMPLOYERS", "VIEW_EMPLOYERS",
                    "MANAGE_MEMBERS", "VIEW_MEMBERS",
                    
                    // Claim Management (Full Access)
                    "MANAGE_CLAIMS", "VIEW_CLAIMS", "CREATE_CLAIM", "UPDATE_CLAIM",
                    "APPROVE_CLAIMS", "REJECT_CLAIMS", "VIEW_CLAIM_STATUS",
                    
                    // Visit Management
                    "MANAGE_VISITS", "VIEW_VISITS",
                    
                    // Pre-Authorization Management (Full Access)
                    "MANAGE_PREAUTH", "VIEW_PREAUTH",
                    // Granular Pre-Auth Permissions
                    "VIEW_PRE_AUTH", "CREATE_PRE_AUTH", "UPDATE_PRE_AUTH",
                    "APPROVE_PRE_AUTH", "REJECT_PRE_AUTH", "CANCEL_PRE_AUTH", "DELETE_PRE_AUTH",
                    
                    // Reporting
                    "MANAGE_REPORTS", "VIEW_REPORTS",
                    
                    // Basic Data Access
                    "VIEW_BASIC_DATA"
                )
        ));
        
        // Role 3: EMPLOYER_ADMIN - Employer company administrator
        roleMap.put("EMPLOYER_ADMIN", ensureRole(
                "EMPLOYER_ADMIN",
                "مدير صاحب العمل",
                "Employer company administrator",
                permissionMap,
                Arrays.asList(
                    "VIEW_MEMBERS",  // View only (MANAGE_MEMBERS is optional feature flag)
                    "VIEW_CLAIMS",
                    "VIEW_VISITS",
                    "VIEW_REPORTS"
                )
        ));
        
        // Role 4: REVIEWER - Medical claim and pre-authorization reviewer
        // UPDATED 2026-01-23: Complete reviewer permissions for Claims & Pre-Approvals workflow
        roleMap.put("REVIEWER", ensureRole(
                "REVIEWER",
                "مراجع طبي",
                "Medical claim and pre-authorization reviewer with full review capabilities",
                permissionMap,
                Arrays.asList(
                    // ═══ Claims Review (Core) ═══
                    "VIEW_CLAIMS",            // View all claims in inbox
                    "APPROVE_CLAIMS",         // Approve claims
                    "REJECT_CLAIMS",          // Reject claims
                    "UPDATE_CLAIM",           // Update claim during review
                    
                    // ═══ Pre-Authorization Review (Core) ═══
                    "VIEW_PRE_AUTH",          // View all pre-authorizations
                    "APPROVE_PRE_AUTH",       // Approve pre-auth requests
                    "REJECT_PRE_AUTH",        // Reject pre-auth requests
                    "UPDATE_PRE_AUTH",        // Update pre-auth during review
                    
                    // ═══ Supporting Data (Read-Only) ═══
                    "VIEW_MEMBERS",           // View member info for review context
                    "VIEW_VISITS",            // View visit history for review context
                    "VIEW_PROVIDERS",         // View provider info
                    
                    // ═══ Reference Data ═══
                    "VIEW_MEDICAL_SERVICES",  // View services catalog
                    "VIEW_MEDICAL_PACKAGES",  // View packages catalog
                    "VIEW_MEDICAL_CATEGORIES",// View categories
                    
                    // ═══ Dashboard & Reports ═══
                    "VIEW_DASHBOARD",         // View dashboards
                    "VIEW_REPORTS",           // View reports
                    "VIEW_BASIC_DATA"         // Basic system data
                )
        ));
        
        // Role 5: PROVIDER - Healthcare provider
        // UPDATED 2026-01-05: Added eligibility check + visit registration (Global Best Practice)
        // UPDATED 2026-01-13: Added pre-authorization submission capabilities
        // Modern healthcare systems give providers real-time eligibility verification
        roleMap.put("PROVIDER", ensureRole(
                "PROVIDER",
                "مقدم خدمة طبية",
                "Healthcare provider with eligibility verification and pre-auth submission",
                permissionMap,
                Arrays.asList(
                    // Eligibility & Visit Management (NEW - Best Practice)
                    "VIEW_MEMBERS",           // Search for patients
                    "eligibility.check",      // Real-time eligibility verification
                    "MANAGE_VISITS",          // Register visits
                    "VIEW_VISITS",            // View own visits only
                    
                    // Claim Management (EXISTING)
                    "CREATE_CLAIM",           // Create claims
                    "UPDATE_CLAIM",           // Update own claims
                    "VIEW_CLAIM_STATUS",      // Track claim status
                    "VIEW_CLAIMS",            // View list of own claims
                    
                    // Pre-Authorization (NEW - Provider can submit and view their requests)
                    "VIEW_PRE_AUTH",          // View pre-authorization requests
                    "CREATE_PRE_AUTH",        // Submit pre-authorization requests

                    // Reporting
                    "VIEW_REPORTS"            // View dashboard and reports
                )
        ));
        
        // Role 6: USER - Basic read-only user
        roleMap.put("USER", ensureRole(
                "USER",
                "مستخدم عادي",
                "Basic read-only user",
                permissionMap,
                Arrays.asList(
                    "VIEW_BASIC_DATA"
                )
        ));
        
        log.info("   📊 Roles: {} total configured", roleMap.size());
        return roleMap;
    }

    /**
     * Helper method to ensure role exists and has correct permissions.
     * UPDATED: Now updates permissions for existing roles to ensure migration.
     */
    private Role ensureRole(String roleName, String displayNameAr, String description, 
                           Map<String, Permission> permissionMap, List<String> permissionNames) {
        
        Set<Permission> permissions = permissionNames.stream()
                .map(permissionMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Check if role already exists
        Optional<Role> existingRoleOpt = roleRepository.findByName(roleName);
        
        if (existingRoleOpt.isPresent()) {
            Role existingRole = existingRoleOpt.get();
            // Update permissions for existing role
            existingRole.setPermissions(permissions);
            roleRepository.save(existingRole);
            log.debug("   🔄 Updated existing role: {} ({} permissions)", roleName, permissions.size());
            return existingRole;
        }
        
        // Role doesn't exist - create it
        Role newRole = Role.builder()
                .name(roleName)
                .description(description + " | " + displayNameAr)
                .permissions(permissions)
                .build();
        
        Role saved = roleRepository.save(newRole);
        log.debug("   ➕ Created role: {} ({} permissions)", roleName, permissions.size());
        return saved;
    }

    /**
     * Step 3: Create single superadmin user if not exists.
     * 100% Idempotent - checks existence before insert.
     */
    private void ensureSuperAdminUser(Map<String, Role> roleMap) {
        log.info("👤 Initializing super admin user...");
        
        String username = "superadmin";
        String email = "superadmin@tba.sa";
        String password = "Admin@123";
        
        // Check if superadmin user already exists
        Optional<User> existingUser = userRepository.findByUsername(username);
        
        if (existingUser.isPresent()) {
            log.info("   ⏭️  Skipping existing user: {}", username);
            return;
        }
        
        // Get SUPER_ADMIN role
        Role superAdminRole = roleMap.get("SUPER_ADMIN");
        if (superAdminRole == null) {
            throw new IllegalStateException("SUPER_ADMIN role not found!");
        }
        
        // Create superadmin user with SUPER_ADMIN role
        User superAdmin = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName("System Super Administrator")
                .active(true)
                .roles(new HashSet<>(Collections.singletonList(superAdminRole)))
                .build();
        
        userRepository.save(superAdmin);
        log.info("   ✅ Created user: {}", username);
    }
}
