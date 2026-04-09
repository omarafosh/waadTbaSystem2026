package com.waad.tba.modules.rbac.repository;

import com.waad.tba.modules.rbac.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.query.Param;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    long countByRolesId(Long roleId);
    long countByRolesName(String roleName);

    @Query("SELECT u.username FROM User u JOIN u.roles r WHERE r.id = :roleId")
    List<String> findUsernamesByRolesId(@Param("roleId") Long roleId);
}
