/**
 * Employers List Page - SPLIT VIEW IMPLEMENTATION
 * Pattern: Form (Right) + Table (Left)
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import { useSnackbar } from 'notistack';

// MUI Components
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

// MUI Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PolicyIcon from '@mui/icons-material/Policy';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import SearchIcon from '@mui/icons-material/Search';

// Project Components
import MainCard from 'components/MainCard';
import UnifiedPageHeader from 'components/UnifiedPageHeader';
import GenericDataTable from 'components/GenericDataTable';
import PermissionGuard from 'components/PermissionGuard';
import useTableState from 'hooks/useTableState';

// Services
import { getEmployers, createEmployer, updateEmployer, archiveEmployer, restoreEmployer } from 'services/api/employers.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUERY_KEY = 'employers';

const emptyForm = {
  code: '',
  name: '', // Unified name
  active: true
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EmployersList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Local State
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
  const savedPageSize = localStorage.getItem('employers_pageSize');

  const tableState = useTableState({
    initialPageSize: savedPageSize ? parseInt(savedPageSize, 10) : 15,
    defaultSort: { field: 'id', direction: 'desc' },
    initialFilters: {}
  });

  // Save page size when it changes
  useEffect(() => {
    localStorage.setItem('employers_pageSize', tableState.pageSize);
  }, [tableState.pageSize]);

  // Debounced Search Handler
  const handleSearchChange = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value);
        tableState.setPage(0); // Reset to first page on search
      }, 500),
    [tableState]
  );

  // Clean up debounce
  useEffect(() => {
    return () => {
      handleSearchChange.cancel();
    }
  }, [handleSearchChange]);

  const closeDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  // ========================================
  // FORM HANDLERS
  // ========================================

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = useCallback(() => {
    setFormMode('create');
    setFormData(emptyForm);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      enqueueSnackbar('اسم جهة العمل مطلوب', { variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === 'create') {
        await createEmployer(formData);
        enqueueSnackbar('تم إضافة جهة العمل بنجاح', { variant: 'success' });
      } else {
        await updateEmployer(formData.id, formData);
        enqueueSnackbar('تم تحديث بيانات جهة العمل بنجاح', { variant: 'success' });
      }

      // Refresh Data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      resetForm();
    } catch (err) {
      console.error('Employer save error:', err);
      enqueueSnackbar(
        err.response?.data?.message || 'فشل حفظ البيانات',
        { variant: 'error' }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = useCallback((row) => {
    setFormMode('edit');
    setFormData({
      id: row.id,
      code: row.code || '',
      name: row.name || '',
      active: row.active ?? true
    });
  }, []);

  // ========================================
  // TABLE ACTIONS
  // ========================================

  const handleDelete = useCallback(
    (id, name) => {
      setConfirmDialog({
        open: true,
        title: 'هل أنت متأكد؟',
        content: `سيتم نقل جهة العمل "${name}" إلى سلة المحذوفات`,
        confirmText: 'نعم، احذفها',
        severity: 'error',
        onConfirm: async () => {
          try {
            await archiveEmployer(id);
            enqueueSnackbar('تم نقل جهة العمل إلى سلة المحذوفات بنجاح.', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            closeDialog();
          } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'فشل حذف جهة العمل', { variant: 'error' });
          }
        }
      });
    },
    [queryClient, enqueueSnackbar]
  );

  const handleRestore = useCallback(
    (id, name) => {
      setConfirmDialog({
        open: true,
        title: 'تأكيد الاستعادة',
        content: `هل تريد استعادة جهة العمل "${name}"؟`,
        confirmText: 'نعم، استعادة',
        severity: 'success',
        onConfirm: async () => {
          try {
            await restoreEmployer(id);
            enqueueSnackbar('تم استعادة جهة العمل بنجاح.', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            closeDialog();
          } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'فشل استعادة جهة العمل', { variant: 'error' });
          }
        }
      });
    },
    [queryClient, enqueueSnackbar]
  );

  const toggleShowArchived = () => {
    setShowArchived(prev => !prev);
    tableState.setPage(0);
  };

  // ========================================
  // DATA FETCHING
  // ========================================

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [QUERY_KEY, tableState.page, tableState.pageSize, tableState.sorting, tableState.columnFilters, showArchived, searchTerm],
    queryFn: async () => {
      const params = {
        page: tableState.page,
        size: tableState.pageSize,
        deleted: showArchived
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (tableState.sorting.length > 0) {
        const sort = tableState.sorting[0];
        params.sort = `${sort.id},${sort.desc ? 'desc' : 'asc'}`;
      } else {
        // Default sort
        params.sort = 'id,desc';
      }

      Object.entries(tableState.columnFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      return await getEmployers(params);
    },
    keepPreviousData: true
  });

  // Flatten data for table
  const tableData = useMemo(() => {
    if (!data?.content) return [];
    return data.content;
  }, [data]);

  const totalCount = data?.totalElements || 0;

  // ========================================
  // COLUMNS
  // ========================================

  const columns = useMemo(() => [
    {
      accessorKey: 'code',
      header: 'الكود',
      enableSorting: true,
      size: 100,
      cell: ({ getValue }) => <Chip label={getValue() || '-'} size="small" variant="outlined" />
    },
    {
      accessorKey: 'name', // Using unified 'name'
      header: 'الاسم',
      enableSorting: true,
      size: 200,
      cell: ({ getValue }) => <Typography variant="body2" fontWeight="medium">{getValue()}</Typography>
    },
    {
      accessorKey: 'active',
      header: 'الحالة',
      enableSorting: true,
      size: 100,
      cell: ({ getValue }) => (
        <Chip
          label={getValue() ? 'نشط' : 'غير نشط'}
          color={getValue() ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      id: 'contracts',
      header: 'العقود',
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <Tooltip title="العقود">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employers/${row.original.id}/contracts`);
            }}
          >
            <PolicyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      enableSorting: false,
      size: 120,
      cell: ({ row }) => {
        const isArchived = !row.original.active && showArchived; // Simplified logic, relies on backend 'deleted' flag mostly

        return (
          <Stack direction="row" spacing={0.5} justifyContent="center" onClick={(e) => e.stopPropagation()}>
            {showArchived ? (
              <PermissionGuard permission="employers.delete">
                <Tooltip title="استعادة">
                  <IconButton
                    color="success"
                    size="small"
                    onClick={() => handleRestore(row.original.id, row.original.name)}
                  >
                    <RestoreFromTrashIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </PermissionGuard>
            ) : (
              <>
                <PermissionGuard permission="employers.update">
                  <Tooltip title="تعديل">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditClick(row.original)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </PermissionGuard>

                <PermissionGuard permission="employers.delete">
                  <Tooltip title="حذف">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(row.original.id, row.original.name)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </PermissionGuard>
              </>
            )}
          </Stack>
        );
      }
    }
  ], [handleEditClick, handleDelete, handleRestore, showArchived, navigate]);

  return (
    <Box>
      <UnifiedPageHeader
        title="إدارة جهات العمل"
        subtitle="عرض وإدارة جهات العمل في النظام"
        icon={<BusinessCenterIcon />}
        actions={
          <Button
            variant={showArchived ? "contained" : "outlined"}
            color={showArchived ? "warning" : "inherit"}
            startIcon={showArchived ? <KeyboardArrowLeftIcon /> : <RestoreFromTrashIcon />}
            onClick={toggleShowArchived}
          >
            {showArchived ? 'العودة للقائمة' : 'المحذوفات'}
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* Left Side: Table */}
        <Grid item xs={12} md={8}>
          <MainCard>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <TextField
                placeholder="بحث..."
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                onChange={(e) => handleSearchChange(e.target.value)}
                sx={{ width: 250 }}
              />
            </Box>

            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error?.response?.data?.message || 'فشل تحميل البيانات'}
              </Alert>
            )}

            <GenericDataTable
              columns={columns}
              data={tableData}
              totalCount={totalCount}
              isLoading={isLoading}
              tableState={tableState}
              onRowClick={(row) => handleEditClick(row)}
            />
          </MainCard>
        </Grid>

        {/* Right Side: Form */}
        <Grid item xs={12} md={4}>
          <MainCard title={formMode === 'create' ? 'إضافة جهة عمل' : 'تعديل جهة عمل'}>
            <PermissionGuard permission={formMode === 'create' ? "employers.create" : "employers.update"}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    name="code"
                    label="الكود"
                    value={formData.code}
                    onChange={handleInputChange}
                    size="small"
                    fullWidth
                  />

                  <TextField
                    name="name"
                    label="الاسم"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    size="small"
                    fullWidth
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        name="active"
                        checked={formData.active}
                        onChange={handleInputChange}
                        color="primary"
                      />
                    }
                    label="نشط"
                  />

                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    {formMode === 'edit' && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CancelIcon />}
                        onClick={resetForm}
                      >
                        إلغاء
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={formMode === 'create' ? <AutoFixHighIcon /> : <SaveIcon />}
                      disabled={isSubmitting}
                    >
                      {formMode === 'create' ? 'إضافة' : 'حفظ'}
                    </Button>
                  </Stack>
                </Stack>
              </form>
            </PermissionGuard>
            <PermissionGuard permission={formMode === 'create' ? "employers.create" : "employers.update"} inverse>
              <Alert severity="info">ليس لديك صلاحية {formMode === 'create' ? 'إضافة' : 'تعديل'} جهات العمل</Alert>
            </PermissionGuard>
          </MainCard>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit">
            {confirmDialog.cancelText}
          </Button>
          <Button onClick={confirmDialog.onConfirm} color={confirmDialog.severity === 'error' ? 'error' : 'primary'} autoFocus>
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployersList;
