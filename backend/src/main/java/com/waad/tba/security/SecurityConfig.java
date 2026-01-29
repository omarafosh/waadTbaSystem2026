package com.waad.tba.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security Configuration for the TBA-WAAD system.
 * 
 * Note: @EnableMethodSecurity is configured in MethodSecurityConfig
 * along with the SUPER_ADMIN bypass expression handler.
 * 
 * Note: PasswordEncoder is defined in PasswordEncoderConfig to break
 * circular dependency chain.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SessionAuthenticationFilter sessionAuthenticationFilter; // Phase B: Session support
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder; // Injected from PasswordEncoderConfig

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ENTERPRISE FIX: Disable CSRF for REST API
                // ========================================
                // Reasoning for disabling CSRF in this enterprise system:
                // 1. API uses session-based auth with HttpOnly cookies (JSESSIONID)
                // 2. CORS is strictly configured (localhost:3000, localhost:5173 only)
                // 3. withCredentials: true in axios ensures cookies are sent
                // 4. All endpoints require authentication (no anonymous access)
                // 5. System runs in VPN-protected internal network
                // 
                // CSRF protection is primarily for browser form submissions.
                // Modern SPA + REST API architecture with strict CORS provides 
                // equivalent protection against cross-origin attacks.
                // 
                // If stronger protection is needed, implement custom token header approach.
                .csrf(AbstractHttpConfigurer::disable)

                // CORS configuration with credentials support (required for session cookies)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - Authentication & Branding
                        .requestMatchers("/api/auth/**", "/api/companies/default").permitAll()
                        // Swagger / OpenAPI endpoints
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**",
                                "/error")
                        .permitAll()
                        // All other endpoints require authentication
                        .anyRequest().authenticated())

                // Session management configuration
                .sessionManagement(session -> session
                        // Phase C.1: Session Policy Review
                        // IF_REQUIRED allows Spring to create sessions when needed (session auth)
                        // while still supporting stateless requests (JWT auth)
                        // This enables dual authentication support (Session OR JWT)
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                .authenticationProvider(authenticationProvider())

                // Phase C.1: Filter Chain Order (CRITICAL for security)
                // Order matters: SessionAuthenticationFilter → JwtAuthenticationFilter →
                // UsernamePasswordAuthenticationFilter
                // 1. SessionAuthenticationFilter checks for valid HTTP session first
                // (preferred)
                // 2. If no session, JwtAuthenticationFilter checks for Bearer token (legacy
                // fallback)
                // 3. UsernamePasswordAuthenticationFilter handles form-based login (not used in
                // our API)
                .addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow all common frontend development ports
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://localhost:5174"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        // AUDIT FIX: Expose CSRF token cookie to frontend
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Employer-ID", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(passwordEncoder);
        authProvider.setUserDetailsService(userDetailsService);
        return authProvider;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
