import { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import PolicyIcon from '@mui/icons-material/Policy';

import AddIcon from '@mui/icons-material/Add';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import ToggleButton from '@mui/material/ToggleButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import GenericDataTable from 'components/GenericDataTable';
import TableErrorBoundary from 'components/TableErrorBoundary';
import RBACGuard from 'components/tba/RBACGuard';
import useTableState from 'hooks/useTableState';
import { getBenefitPolicies, deleteBenefitPolicy, restoreBenefitPolicy } from 'services/api/benefit-policies.service';

const QUERY_KEY = 'benefit-policies';

const STATUS_CONFIG = {
  DRAFT: { label: 'مسودة', color: 'default' },
  ACTIVE: { label: 'نشط', color: 'success' },
  INACTIVE: { label: 'غير نشط', color: 'default' },
  SUSPENDED: { label: 'موقوف', color: 'warning' },
  EXPIRED: { label: 'منتهي', color: 'error' },
  CANCELLED: { label: 'ملغي', color: 'error' }
};

const BenefitPoliciesList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [showDeleted, setShowDeleted] = useState(false);

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: null,
    confirmText: 'نعم',
    cancelText: 'إلغاء',
    severity: 'warning'
  });

  // Persist pagination size
  const savedPageSize = localStorage.getItem('benefitPolicies_pageSize');

  const tableState = useTableState({
    initialPageSize: savedPageSize ? parseInt(savedPageSize, 10) : 8,
    defaultSort: { field: 'createdAt', direction: 'desc' },
    initialFilters: {}
  });

  // Save page size when it changes
  useEffect(() => {
    localStorage.setItem('benefitPolicies_pageSize', tableState.pageSize);
  }, [tableState.pageSize]);

  const handleNavigateAdd = useCallback(() => navigate('/benefit-policies/create'), [navigate]);
  const handleNavigateView = useCallback((id) => navigate(`/benefit-policies/${id}`), [navigate]);
  const handleNavigateEdit = useCallback((id) => navigate(`/benefit-policies/edit/${id}`), [navigate]);

  const closeDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: restoreBenefitPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      enqueueSnackbar('تم استعادة الوثيقة بنجاح', { variant: 'success' });
      closeDialog();
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || 'فشلت عملية الاستعادة', { variant: 'error' });
      closeDialog();
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBenefitPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      enqueueSnackbar('تم حذف الوثيقة بنجاح', { variant: 'success' });
      closeDialog();
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || 'فشل الحذف', { variant: 'error' });
      closeDialog();
    }
  });

  const handleDelete = useCallback((id) => {
    setConfirmDialog({
      open: true,
      title: 'هل أنت متأكد؟',
      content: "سيتم نقل الوثيقة إلى سلة المحذوفات",
      confirmText: 'نعم، احذفها',
      severity: 'error',
      onConfirm: () => {
        deleteMutation.mutate(id);
      }
    });
  }, [deleteMutation]);

  const handleRestore = useCallback((id) => {
    setConfirmDialog({
      open: true,
      title: 'تأكيد الاستعادة',
      content: "هل تريد استعادة هذه الوثيقة؟",
      confirmText: 'نعم، استعادة',
      severity: 'success',
      onConfirm: () => {
        restoreMutation.mutate(id);
      }
    });
  }, [restoreMutation]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [QUERY_KEY, tableState.page, tableState.pageSize, tableState.sorting, tableState.columnFilters, showDeleted],
    queryFn: async () => {
      const params = {
        page: tableState.page,
        size: tableState.pageSize,
        includeDeleted: showDeleted
      };
      if (tableState.sorting.length > 0) {
        const sort = tableState.sorting[0];
        params.sort = `${sort.id},${sort.desc ? 'desc' : 'asc'}`;
      }
      Object.entries(tableState.columnFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) params[key] = value;
      });
      return await getBenefitPolicies(params);
    },
    keepPreviousData: true
  });

  const columns = useMemo(() => [
    {
      accessorKey: 'policyCode',
      header: 'رمز السياسة',
      enableSorting: true,
      enableColumnFilter: false,
      minWidth: 120,
      align: 'right',
      cell: ({ getValue }) => <Chip label={getValue() || '-'} size="small" variant="outlined" color="primary" />
    },
    {
      accessorKey: 'name',
      header: 'اسم السياسة',
      enableSorting: true,
      enableColumnFilter: false,
      minWidth: 250,
      align: 'right',
      cell: ({ getValue }) => <Typography variant="body2" fontWeight={500}>{getValue() || '-'}</Typography>
    },
    {
      accessorKey: 'employerName',
      header: 'الشريك',
      enableSorting: true,
      enableColumnFilter: false,
      minWidth: 200,
      align: 'right',
      cell: ({ getValue }) => <Typography variant="body2">{getValue() || '-'}</Typography>
    },
    {
      accessorKey: 'startDate',
      header: 'تاريخ البدء',
      enableSorting: true,
      enableColumnFilter: false,
      minWidth: 120,
      align: 'center',
      cell: ({ getValue }) => {
        const date = getValue();
        return date ? <Chip label={dayjs(date).format('YYYY-MM-DD')} size="small" variant="outlined" /> : '-';
      }
    },
    {
      accessorKey: 'endDate',
      header: 'تاريخ الانتهاء',
      enableSorting: true,
      enableColumnFilter: false,
      minWidth: 120,
      align: 'center',
      cell: ({ getValue }) => {
        const date = getValue();
        return date ? <Chip label={dayjs(date).format('YYYY-MM-DD')} size="small" variant="outlined" /> : '-';
      }
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      enableSorting: true,
      enableColumnFilter: false,
      minWidth: 120,
      align: 'center',
      cell: ({ getValue, row }) => {
        const status = getValue();
        // If row is deleted (active=false) but status is not CANCELLED/INACTIVE, show as Deleted
        if (row.original.active === false && status !== 'CANCELLED' && status !== 'INACTIVE') {
          return <Chip label="محذوف" color="error" size="small" />;
        }
        const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
        return <Chip label={config.label} color={config.color} size="small" />
      }
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      enableSorting: false,
      enableColumnFilter: false,
      minWidth: 150,
      align: 'center',
      cell: ({ row }) => {
        const isDeleted = !row.original?.active;

        return (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            {isDeleted ? (
              <RBACGuard requiredPermissions={['benefit_policies.delete']}>
                <Tooltip title="استعادة">
                  <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleRestore(row.original?.id); }}>
                    <RestoreFromTrashIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </RBACGuard>
            ) : (
              <>
                <Tooltip title="عرض">
                  <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleNavigateView(row.original?.id); }}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <RBACGuard requiredPermissions={['benefit_policies.update']}>
                  <Tooltip title="تعديل">
                    <IconButton size="small" color="info" onClick={(e) => { e.stopPropagation(); handleNavigateEdit(row.original?.id); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </RBACGuard>

                <RBACGuard requiredPermissions={['benefit_policies.delete']}>
                  <Tooltip title="حذف">
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(row.original?.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </RBACGuard>
              </>
            )}
          </Stack>
        );
      }
    }
  ], [handleNavigateView, handleNavigateEdit, handleDelete, handleRestore]);

  return (
    <RBACGuard requiredPermissions={['benefit_policies.view']}>
      <Box>
        <ModernPageHeader
          title="سياسات المنافع"
          subtitle="إدارة سياسات المنافع والتغطية التأمينية"
          icon={PolicyIcon}
          breadcrumbs={[{ label: 'الرئيسية', path: '/dashboard' }, { label: 'سياسات المنافع' }]}
          actions={
            <Stack direction="row" spacing={2} alignItems="center">
              <ToggleButton
                value="check"
                selected={showDeleted}
                onChange={() => setShowDeleted(!showDeleted)}
                color="warning"
                size="small"
                sx={{ borderRadius: 2, px: 2 }}
              >
                <DeleteSweepIcon sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">
                  {showDeleted ? 'إخفاء المحذوفات' : 'عرض المحذوفات'}
                </Typography>
              </ToggleButton>

              <RBACGuard requiredPermissions={['benefit_policies.create']}>
                <Button
                  variant="contained"
                  startIcon={<Box component={AddIcon} />}
                  onClick={handleNavigateAdd}
                >
                  إنشاء سياسة جديدة
                </Button>
              </RBACGuard>
            </Stack>
          }
        />
        <MainCard>
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              فشل تحميل البيانات: {error?.response?.data?.message || error?.message || 'خطأ غير معروف'}
            </Alert>
          )}
          <TableErrorBoundary>
            <GenericDataTable
              columns={columns}
              data={data?.content || []}
              totalCount={data?.totalElements || 0}
              isLoading={isLoading}
              tableState={tableState}
              enableFiltering={false}
              enableSorting={true}
              enablePagination={true}
              stickyHeader={true}
              minHeight={400}
              maxHeight="calc(100vh - 300px)"
              onRowClick={(row) => handleNavigateView(row.id)}
              emptyMessage="لا توجد سياسات"
              rowsPerPageOptions={[8, 16, 24, 32, 40]}
            />
          </TableErrorBoundary>
        </MainCard>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.content}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit">{confirmDialog.cancelText}</Button>
          <Button onClick={confirmDialog.onConfirm} color={confirmDialog.severity === 'error' ? 'error' : 'primary'} autoFocus>
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </RBACGuard>
  );
};

export default BenefitPoliciesList;
