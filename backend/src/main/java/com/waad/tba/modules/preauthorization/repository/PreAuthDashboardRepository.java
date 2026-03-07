package com.waad.tba.modules.preauthorization.repository;

import com.waad.tba.modules.preauthorization.entity.PreAuthorization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PreAuthDashboardRepository extends JpaRepository<PreAuthorization, Long> {

    @Query("SELECT " +
           "COUNT(pa), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.PENDING THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.APPROVED THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.REJECTED THEN 1 ELSE 0 END), " +
           "SUM(pa.contractPrice), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.APPROVED THEN pa.approvedAmount ELSE 0 END) " +
           "FROM PreAuthorization pa WHERE pa.active = true")
    Object[] getOverallStats();

    @Query("SELECT pa.requestDate, COUNT(pa), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.APPROVED THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.REJECTED THEN 1 ELSE 0 END), " +
           "SUM(pa.contractPrice), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.APPROVED THEN pa.approvedAmount ELSE 0 END) " +
           "FROM PreAuthorization pa " +
           "WHERE pa.active = true AND pa.requestDate >= :startDate " +
           "GROUP BY pa.requestDate " +
           "ORDER BY pa.requestDate ASC")
    List<Object[]> getTrends(@Param("startDate") LocalDate startDate);

    @Query("SELECT pa.providerId, COUNT(pa), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.APPROVED THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN pa.status = com.waad.tba.modules.preauthorization.entity.PreAuthorization.PreAuthStatus.APPROVED THEN pa.approvedAmount ELSE 0 END) " +
           "FROM PreAuthorization pa " +
           "WHERE pa.active = true " +
           "GROUP BY pa.providerId " +
           "ORDER BY COUNT(pa) DESC")
    List<Object[]> getTopProviders(org.springframework.data.domain.Pageable pageable);
}
