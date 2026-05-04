package com.waad.tba.modules.rbac.repository;

import com.waad.tba.modules.rbac.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByName(String name);
    Boolean existsByName(String name);
    
    @Query("SELECT p FROM Permission p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Permission> searchPermissions(String query);

    /**
     * Extracts only the names of all permissions directly from the database,
     * avoiding the overhead of loading full entities into memory.
     */
    @Query("SELECT p.name FROM Permission p")
    List<String> findAllPermissionNames();
}
