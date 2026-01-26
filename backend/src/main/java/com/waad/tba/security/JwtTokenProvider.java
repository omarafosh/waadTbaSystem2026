package com.waad.tba.security;

import com.waad.tba.modules.rbac.entity.Permission;
import com.waad.tba.modules.rbac.entity.Role;
import com.waad.tba.modules.rbac.entity.User;
import com.waad.tba.modules.rbac.repository.PermissionRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT Token Provider for authentication.
 * 
 * CRITICAL FEATURE:
 * SUPER_ADMIN users automatically receive ALL permissions in their JWT token,
 * ensuring they are NEVER blocked by any permission check.
 * 
 * @author TBA WAAD System
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";

    private final PermissionRepository permissionRepository;

    @Value("${jwt.secret:ThisIsAVeryLongSecretKeyForJWTTokenGenerationWithAtLeast256BitsLength12345678}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate JWT token for user.
     * 
     * CRITICAL: SUPER_ADMIN users get ALL permissions in the token.
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        // Check if user is SUPER_ADMIN
        boolean isSuperAdmin = roles.contains(SUPER_ADMIN_ROLE);

        List<String> permissions;
        
        if (isSuperAdmin) {
            // SUPER_ADMIN gets ALL permissions
            permissions = permissionRepository.findAll().stream()
                    .map(Permission::getName)
                    .collect(Collectors.toList());
            
            log.info("🔓 SUPER_ADMIN JWT generated with ALL {} permissions (unrestricted access)", 
                    permissions.size());
        } else {
            // Regular users get only their role-based permissions
            permissions = user.getRoles().stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .map(permission -> permission.getName())
                    .distinct()
                    .collect(Collectors.toList());
        }

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .claim("email", user.getEmail())
                .claim("roles", roles)
                .claim("permissions", permissions)
                .claim("employerId", user.getEmployerId()) // Phase 8: Add employer ID
                .claim("companyId", user.getCompanyId())   // Phase 8: Add company ID
                .claim("isSuperAdmin", isSuperAdmin)       // Flag for frontend
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }
}
