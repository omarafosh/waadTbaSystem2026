package com.waad.tba.modules.provider.repository;

import com.waad.tba.modules.provider.entity.ProviderAllowedEmployer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderAllowedEmployerRepository 
        extends JpaRepository<ProviderAllowedEmployer, Long> {

    /**
     * جلب جميع الجهات المسموحة النشطة لمزود معين
     */
    List<ProviderAllowedEmployer> findByProviderIdAndActiveTrue(Long providerId);

    /**
     * جلب جميع الجهات المسموحة لمزود (نشطة وغير نشطة)
     */
    List<ProviderAllowedEmployer> findByProviderId(Long providerId);

    /**
     * التحقق من إذن جهة معينة لمزود معين
     */
    boolean existsByProviderIdAndEmployerIdAndActiveTrue(
        Long providerId, Long employerId);

    /**
     * البحث عن علاقة محددة
     */
    Optional<ProviderAllowedEmployer> findByProviderIdAndEmployerId(
        Long providerId, Long employerId);

    /**
     * تعطيل جهة معينة لمزود
     */
    @Modifying
    @Query("UPDATE ProviderAllowedEmployer p SET p.active = false, " +
           "p.updatedBy = :username WHERE p.provider.id = :providerId " +
           "AND p.employer.id = :employerId")
    int deactivate(@Param("providerId") Long providerId, 
                   @Param("employerId") Long employerId,
                   @Param("username") String username);

    /**
     * تعطيل جميع الجهات لمزود (للتحديث الكامل)
     */
    @Modifying
    @Query("UPDATE ProviderAllowedEmployer p SET p.active = false, " +
           "p.updatedBy = :username WHERE p.provider.id = :providerId")
    int deactivateAllForProvider(@Param("providerId") Long providerId,
                                  @Param("username") String username);

    /**
     * جلب IDs الجهات المسموحة
     */
    @Query("SELECT p.employer.id FROM ProviderAllowedEmployer p " +
           "WHERE p.provider.id = :providerId AND p.active = true")
    List<Long> findAllowedEmployerIds(@Param("providerId") Long providerId);
}
