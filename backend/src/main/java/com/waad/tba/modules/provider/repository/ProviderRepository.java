package com.waad.tba.modules.provider.repository;

import com.waad.tba.modules.provider.entity.Provider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderRepository extends JpaRepository<Provider, Long> {

    /**
     * Search active providers with pagination
     * Searches in both Arabic and English names
     */
    @Query("SELECT p FROM Provider p " +
           "WHERE p.active = true " +
           "AND (LOWER(p.nameArabic) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.nameEnglish) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.licenseNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.city) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Provider> searchPaged(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Search ALL providers (active and inactive) with pagination
     * Searches in both Arabic and English names
     */
    @Query("SELECT p FROM Provider p " +
           "WHERE (LOWER(p.nameArabic) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.nameEnglish) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.licenseNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.city) LIKE LOWER(CONCAT('%', :keyword, '%')))") 
    Page<Provider> searchPagedAll(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Provider p WHERE p.active = true")
    List<Provider> findAllActive();

    @Query("SELECT COUNT(p) FROM Provider p WHERE p.active = true")
    long countActive();

    /**
     * Search providers by name (Arabic or English) or license number
     */
    @Query("SELECT p FROM Provider p " +
           "WHERE LOWER(p.nameArabic) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.nameEnglish) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.licenseNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Provider> search(@Param("query") String query);

    /**
     * @deprecated Use existsByNameArabic or existsByNameEnglish
     */
    @Deprecated
    default boolean existsByName(String name) {
        return existsByNameArabic(name) || existsByNameEnglish(name);
    }
    
    boolean existsByNameArabic(String nameArabic);
    
    boolean existsByNameEnglish(String nameEnglish);

    boolean existsByLicenseNumber(String licenseNumber);
    
    java.util.Optional<Provider> findByLicenseNumber(String licenseNumber);

    // ═══════════════════════════════════════════════════════════════════════════════
    // DASHBOARD STATISTICS QUERIES (Phase A)
    // Aggregations using JPQL - No Lazy Loading, No Entities returned
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Count active providers
     */
    @Query("SELECT COUNT(p) FROM Provider p WHERE p.active = true")
    long countActiveProviders();
}
