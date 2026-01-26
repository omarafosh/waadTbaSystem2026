/**
 * Providers List Page - SIMPLIFIED IMPLEMENTATION
 * Healthcare Providers (Hospitals, Clinics, Labs, Pharmacies)
 *
 * Architecture (2026-01-14 Cleanup):
 * ✅ Simple data table - No filters (removed as non-functional)
 * ✅ Auto-refresh on navigation back (useEffect on mount)
 * ❌ NO Excel import (removed)
 * ❌ NO filters (removed - were not working)
 * ❌ NO Excel export
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// MUI Components
import { Box, IconButton, Stack, Tooltip, Typography, Chip, Button, Skeleton } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import RefreshIcon from '@mui/icons-material/Refresh';

// Project Components
import MainCard from 'components/MainCard';
import UnifiedPageHeader from 'components/UnifiedPageHeader';
import PermissionGuard from 'components/PermissionGuard';

// Insurance UX Components
import { NetworkBadge, CardStatusBadge } from 'components/insurance';

// Services
import { providersService } from 'services/api';

// Snackbar
import { openSnackbar } from 'api/snackbar';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUERY_KEY = 'providers';
const MODULE_NAME = 'providers';

// Provider Type Labels (Arabic)
const PROVIDER_TYPE_LABELS_AR = {
  HOSPITAL: 'مستشفى',
  CLINIC: 'عيادة',
  LAB: 'مختبر',
  LABORATORY: 'مختبر',
  PHARMACY: 'صيدلية',
  RADIOLOGY: 'مركز أشعة'
};

// Provider Type Colors
const PROVIDER_TYPE_COLORS = {
  HOSPITAL: 'error',
  CLINIC: 'primary',
  LAB: 'warning',
  LABORATORY: 'warning',
  PHARMACY: 'success',
  RADIOLOGY: 'info'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get network tier from provider
 */
const getNetworkTier = (provider) => {
  if (provider?.networkStatus) return provider.networkStatus;
  if (provider?.inNetwork === true) return 'IN_NETWORK';
  if (provider?.inNetwork === false) return 'OUT_OF_NETWORK';
  if (provider?.contracted === true) return 'IN_NETWORK';
  if (provider?.contracted === false) return 'OUT_OF_NETWORK';
  return null;
};

/**
 * Get provider status
 */
const getProviderStatus = (provider) => {
  if (provider?.status) return provider.status;
  if (provider?.active === true) return 'ACTIVE';
  if (provider?.active === false) return 'INACTIVE';
  return 'ACTIVE';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProvidersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // ========================================
  // PAGINATION STATE (Simple, no filters)
  // ========================================

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ========================================
  // AUTO-REFRESH ON NAVIGATION BACK
  // ========================================

  useEffect(() => {
    // Invalidate cache when navigating back to this page
    // This ensures newly created providers appear immediately
    console.log('[ProvidersList] Page mounted/navigated - refreshing data');
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [location.key, queryClient]);

  // ========================================
  // NAVIGATION HANDLERS
  // ========================================

  const handleNavigateAdd = useCallback(() => {
    navigate('/providers/add');
  }, [navigate]);

  const handleNavigateView = useCallback(
    (id) => {
      navigate(`/providers/${id}`);
    },
    [navigate]
  );

  const handleNavigateEdit = useCallback(
    (id) => {
      navigate(`/providers/edit/${id}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (id, name) => {
      const confirmMessage = `هل أنت متأكد من حذف مقدم الخدمة "${name}"؟`;
      if (!window.confirm(confirmMessage)) return;

      try {
        await providersService.remove(id);
        openSnackbar({
          message: 'تم حذف مقدم الخدمة بنجاح',
          variant: 'success'
        });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      } catch (err) {
        console.error('[Providers] Delete failed:', err);
        openSnackbar({
          message: 'فشل حذف مقدم الخدمة. يرجى المحاولة لاحقاً',
          variant: 'error'
        });
      }
    },
    [queryClient]
  );

  // ========================================
  // PAGINATION HANDLERS
  // ========================================

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // ========================================
  // DATA FETCHING WITH REACT QUERY
  // ========================================

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, page, rowsPerPage],
    queryFn: async () => {
      console.log('[ProvidersList] Fetching providers - page:', page + 1, 'size:', rowsPerPage);
      
      const params = {
        page: page + 1, // Backend uses 1-based pages
        size: rowsPerPage,
        sort: 'id,desc' // Default sort by newest first
      };

      const result = await providersService.getAll(params);
      
      console.log('[ProvidersList] API Response:', {
        totalElements: result?.totalElements,
        contentLength: result?.content?.length,
        firstItem: result?.content?.[0]
      });
      
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: 'always' // Always refetch when component mounts
  });

  // Extract data
  const providers = useMemo(() => data?.content || [], [data]);
  const totalCount = data?.totalElements || 0;

  // ========================================
  // LOADING SKELETON
  // ========================================

  const LoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton variant="text" width={150} /></TableCell>
          <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
          <TableCell><Skeleton variant="text" width={60} /></TableCell>
          <TableCell><Skeleton variant="text" width={80} /></TableCell>
          <TableCell><Skeleton variant="text" width={100} /></TableCell>
          <TableCell><Skeleton variant="rounded" width={70} height={24} /></TableCell>
          <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
          <TableCell><Skeleton variant="rounded" width={100} height={32} /></TableCell>
        </TableRow>
      ))}
    </>
  );

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <Box>
      {/* ====== UNIFIED PAGE HEADER ====== */}
      <PermissionGuard requires="providers.view">
        <UnifiedPageHeader
          title="مقدمي الخدمات الصحية"
          subtitle="إدارة المستشفيات والعيادات والمختبرات والصيدليات"
          icon={LocalHospitalIcon}
          breadcrumbs={[{ label: 'الرئيسية', path: '/' }, { label: 'مقدمي الخدمات' }]}
          pdfModule={MODULE_NAME}
          showAddButton={true}
          addButtonLabel="إضافة مقدم خدمة"
          onAddClick={handleNavigateAdd}
          additionalActions={
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              size="small"
            >
              تحديث
            </Button>
          }
        />
      </PermissionGuard>

      {/* ====== DATA TABLE ====== */}
      <MainCard>
        {/* Error State */}
        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              حدث خطأ في تحميل البيانات
            </Typography>
            <Button variant="outlined" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </Box>
        )}

        {/* Table */}
        {!error && (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>اسم مقدم الخدمة</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="center">النوع</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="center">الرمز</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>المدينة</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>الهاتف</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="center">الشبكة</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="center">الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="center">الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : providers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          لا توجد مقدمي خدمات
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleNavigateAdd}
                          sx={{ mt: 2 }}
                        >
                          إضافة مقدم خدمة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    providers.map((provider) => (
                      <TableRow
                        key={provider.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleNavigateView(provider.id)}
                      >
                        {/* Name */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {provider.nameArabic || provider.name || '-'}
                          </Typography>
                          {provider.nameEnglish && provider.nameEnglish !== (provider.nameArabic || provider.name) && (
                            <Typography variant="caption" color="text.secondary" dir="ltr" display="block">
                              {provider.nameEnglish}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Type */}
                        <TableCell align="center">
                          <Chip
                            label={PROVIDER_TYPE_LABELS_AR[provider.providerType] ?? provider.providerType ?? '-'}
                            color={PROVIDER_TYPE_COLORS[provider.providerType] || 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>

                        {/* ID */}
                        <TableCell align="center">
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            {provider.id || '-'}
                          </Typography>
                        </TableCell>

                        {/* City */}
                        <TableCell>
                          <Typography variant="body2">
                            {provider.city ?? provider.region ?? '-'}
                          </Typography>
                        </TableCell>

                        {/* Phone */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" dir="ltr">
                            {provider.phone ?? provider.contactPhone ?? '-'}
                          </Typography>
                        </TableCell>

                        {/* Network Status */}
                        <TableCell align="center">
                          {getNetworkTier(provider) ? (
                            <NetworkBadge networkTier={getNetworkTier(provider)} showLabel={true} size="small" language="ar" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center">
                          <CardStatusBadge status={getProviderStatus(provider)} size="small" language="ar" />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="عرض">
                              <IconButton size="small" color="primary" onClick={() => handleNavigateView(provider.id)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="تعديل">
                              <IconButton size="small" color="info" onClick={() => handleNavigateEdit(provider.id)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <PermissionGuard requires="providers.delete">
                              <Tooltip title="حذف">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(provider.id, provider.nameArabic || provider.name)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="عدد الصفوف:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </>
        )}
      </MainCard>
    </Box>
  );
}
