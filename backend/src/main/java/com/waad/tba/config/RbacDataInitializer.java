package com.waad.tba.config;

import java.util.ArrayList;
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
 * RBAC Data Initializer - Clean Foundation (Version 3.0)
 * 
 * Initializes the complete RBAC system with:
 * - All permissions from AppPermission enum (Granular Resource-Action model)
 * - 6 business-aligned roles:
 *   1. SUPER_ADMIN: Full system access (All permissions)
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
 * @version 3.0
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
        log.info("║  RBAC Data Initializer - Granular Permissions v3.0         ║");
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
                Permission p = existingPerm.get();
                // Update existing permission metadata
                p.setDescription(appPerm.getDescription());
                p.setNameAr(appPerm.getDisplayNameAr());
                p.setModule(appPerm.getModule());
                permissionRepository.save(p);
                
                permissionMap.put(permName, p);
                skipped++;
            } else {
                Permission newPerm = Permission.builder()
                        .name(permName)
                        .nameAr(appPerm.getDisplayNameAr())
                        .description(appPerm.getDescription())
                        .module(appPerm.getModule())
                        .build();
                
                Permission saved = permissionRepository.save(newPerm);
                permissionMap.put(permName, saved);
                created++;
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
        
        // Role 1: SUPER_ADMIN - Full system access (Auto-assign ALL permissions)
        roleMap.put("SUPER_ADMIN", ensureRole(
                "SUPER_ADMIN",
                "المدير العام للنظام",
                "Full system administrator with all permissions",
                permissionMap,
                Arrays.asList(AppPermission.getAllPermissionNames()) // ALL PERMISSIONS
        ));
        
        // Role 2: INSURANCE_ADMIN - Insurance company administrator
        // Has almost everything except MANAGE_RBAC (security)
        List<String> insuranceApiPermissions = new ArrayList<>();
        // Add all except RBAC
        for(AppPermission p : AppPermission.values()) {
            if(!p.name().startsWith("MANAGE_RBAC") && !p.name().equals("MANAGE_SYSTEM_SETTINGS")) {
                insuranceApiPermissions.add(p.name());
            }
        }
        // Add specific allowed system settings if needed
        insuranceApiPermissions.add("MANAGE_SYSTEM_SETTINGS"); 
        
        roleMap.put("INSURANCE_ADMIN", ensureRole(
                "INSURANCE_ADMIN",
                "مدير شركة التأمين",
                "Insurance company administrator with full system access",
                permissionMap,
                insuranceApiPermissions
        ));
        
        // Role 3: EMPLOYER_ADMIN - Employer company administrator
        roleMap.put("EMPLOYER_ADMIN", ensureRole(
                "EMPLOYER_ADMIN",
                "مدير صاحب العمل",
                "Employer company administrator",
                permissionMap,
                Arrays.asList(
                    "VIEW_MEMBERS", "PRINT_MEMBERS", "EXPORT_MEMBERS",
                    "VIEW_CLAIMS", "PRINT_CLAIMS", "EXPORT_CLAIMS",
                    "VIEW_VISITS", "PRINT_VISITS", "EXPORT_VISITS",
                    "VIEW_REPORTS", "PRINT_REPORTS", "EXPORT_REPORTS",
                    "VIEW_BASIC_DATA"
                )
        ));
        
        // Role 4: REVIEWER - Medical claim and pre-authorization reviewer
        roleMap.put("REVIEWER", ensureRole(
                "REVIEWER",
                "مراجع طبي",
                "Medical claim and pre-authorization reviewer",
                permissionMap,
                Arrays.asList(
                    // Claims
                    "VIEW_CLAIMS", "UPDATE_CLAIM", "APPROVE_CLAIMS", "REJECT_CLAIMS", "VIEW_CLAIM_STATUS",
                    "PRINT_CLAIMS", "EXPORT_CLAIMS",
                    
                    // Pre-Auth
                    "VIEW_PREAUTH", "VIEW_PRE_AUTH", "APPROVE_PRE_AUTH", "REJECT_PRE_AUTH", "UPDATE_PRE_AUTH",
                    "PRINT_PREAUTH", "EXPORT_PREAUTH",
                    
                    // Read-only access to needed data
                    "VIEW_MEMBERS", "VIEW_VISITS", "VIEW_PROVIDERS",
                    "VIEW_MEDICAL_SERVICES", "VIEW_MEDICAL_PACKAGES", "VIEW_BENEFIT_POLICIES",
                    
                    // Reports
                    "VIEW_DASHBOARD", "VIEW_REPORTS", "PRINT_REPORTS", "EXPORT_REPORTS",
                    
                    "VIEW_BASIC_DATA"
                )
        ));
        
        // Role 5: PROVIDER - Healthcare provider
        roleMap.put("PROVIDER", ensureRole(
                "PROVIDER",
                "مقدم خدمة طبية",
                "Healthcare provider with eligibility and claim submission",
                permissionMap,
                Arrays.asList(
                    // Eligibility & Visits
                    "VIEW_MEMBERS", "CHECK_ELIGIBILITY",
                    "CREATE_VISIT", "VIEW_VISITS", "PRINT_VISITS",
                    
                    // Claims
                    "CREATE_CLAIM", "UPDATE_CLAIM", "VIEW_CLAIMS", "VIEW_CLAIM_STATUS",
                    "PRINT_CLAIMS", "EXPORT_CLAIMS",
                    
                    // Pre-Auth
                    "CREATE_PREAUTH", "CREATE_PRE_AUTH", "VIEW_PREAUTH", "VIEW_PRE_AUTH",
                    "PRINT_PREAUTH",
                    
                    // Reports
                    "VIEW_REPORTS", "PRINT_REPORTS",
                    
                    "VIEW_BASIC_DATA"
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
     */
    private void ensureSuperAdminUser(Map<String, Role> roleMap) {
        log.info("👤 Initializing super admin user...");
        
        String username = "superadmin";
        String email = "superadmin@tba.sa";
        
        // Check if superadmin user already exists
        Optional<User> existingUser = userRepository.findByUsername(username);
        
        if (existingUser.isPresent()) {
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
                .password(passwordEncoder.encode("Admin@123"))
                .fullName("System Super Administrator")
                .active(true)
                .roles(new HashSet<>(Collections.singletonList(superAdminRole)))
                .build();
        
        userRepository.save(superAdmin);
        log.info("   ✅ Created user: {}", username);
    }
}
