package com.waad.tba.modules.employer.repository;

import com.waad.tba.modules.employer.entity.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * LEGACY REPOSITORY - READ ONLY
 * 
 * @deprecated Use {@link com.waad.tba.common.repository.OrganizationRepository} instead.
 *             This repository is kept for backward compatibility ONLY.
 *             DO NOT use save(), saveAll(), delete(), or any write operations.
 *             All writes must go through OrganizationRepository with type=EMPLOYER.
 */
@Deprecated
public interface EmployerRepository extends JpaRepository<Employer, Long> {

    List<Employer> findByActiveTrue();
    
    Optional<Employer> findByCode(String code);
    
    Optional<Employer> findByEmail(String email);
    
    /**
     * Find employer by Arabic name (case-insensitive exact match)
     */
    Optional<Employer> findByNameArIgnoreCase(String nameAr);
    
    /**
     * Find employer by English name (case-insensitive exact match)
     */
    Optional<Employer> findByNameEnIgnoreCase(String nameEn);
    
    /**
     * Find employer by name (Arabic or English, case-insensitive)
     */
    @Query("SELECT e FROM Employer e WHERE LOWER(e.nameAr) = LOWER(:name) OR LOWER(e.nameEn) = LOWER(:name)")
    Optional<Employer> findByNameIgnoreCase(@Param("name") String name);
    
    /**
     * Find employers by name containing (partial match for import - searches both Arabic and English)
     */
    @Query("SELECT e FROM Employer e WHERE LOWER(e.nameAr) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(e.nameEn) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Employer> findByNameContainingIgnoreCase(@Param("name") String name);
}
