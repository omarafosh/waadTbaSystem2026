package com.waad.tba.modules.rbac.repository;

import com.waad.tba.modules.rbac.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchUsers(String query);
    
    Optional<User> findByUsernameOrEmail(String username, String email);
    List<User> findByProviderId(Long providerId);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = 'PROVIDER' AND u.providerId IS NULL")
    List<User> findUnassignedProviders();

    // PERFORMANCE OPTIMIZATION: Pushes username filtering to the database instead of O(N) in-memory table scan via findAll()
    @Query("SELECT u.username FROM User u JOIN u.roles r WHERE r.id = :roleId")
    List<String> findUsernamesByRoleId(@org.springframework.data.repository.query.Param("roleId") Long roleId);

    // PERFORMANCE OPTIMIZATION: Offloads user counting to DB aggregation (eliminates loading all users into application memory)
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.id = :roleId")
    long countUsersByRoleId(@org.springframework.data.repository.query.Param("roleId") Long roleId);

    // PERFORMANCE OPTIMIZATION: Resolves N+1 database queries when mapping Role -> user counts by enabling batch lookups
    @Query("SELECT r.id, COUNT(u) FROM User u JOIN u.roles r WHERE r.id IN :roleIds GROUP BY r.id")
    List<Object[]> countUsersByRoleIds(@org.springframework.data.repository.query.Param("roleIds") List<Long> roleIds);
}
