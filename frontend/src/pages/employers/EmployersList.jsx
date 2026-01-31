/**
 * Employers List Page - SPLIT VIEW IMPLEMENTATION
 * Pattern: Form (Right) + Table (Left)
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import Swal from 'sweetalert2';

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
  InputAdornment
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
import { openSnackbar } from 'api/snackbar';

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

  // Local State
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      openSnackbar({ message: 'اسم جهة العمل مطلوب', variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === 'create') {
        await createEmployer(formData);
        openSnackbar({ message: 'تم إضافة جهة العمل بنجاح', variant: 'success' });
      } else {
        await updateEmployer(formData.id, formData);
        openSnackbar({ message: 'تم تحديث بيانات جهة العمل بنجاح', variant: 'success' });
      }

      // Refresh Data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      resetForm();
    } catch (err) {
      console.error('Employer save error:', err);
      openSnackbar({
        message: err.response?.data?.message || 'فشل حفظ البيانات',
        variant: 'error'
      });
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
    async (id, name) => {
      const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: `سيتم نقل جهة العمل "${name}" إلى سلة المحذوفات`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذفها',
        cancelButtonText: 'إلغاء'
      });

      if (!result.isConfirmed) return;

      try {
        await archiveEmployer(id);

        Swal.fire(
          'تم الحذف!',
          'تم نقل جهة العمل إلى سلة المحذوفات بنجاح.',
          'success'
        );

        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      } catch (err) {
        Swal.fire(
          'خطأ!',
          err.response?.data?.message || 'فشل حذف جهة العمل',
          'error'
        );
      }
    },
    [queryClient]
  );

  const handleRestore = useCallback(
    async (id, name) => {
      const result = await Swal.fire({
        title: 'تأكيد الاستعادة',
        text: `هل تريد استعادة جهة العمل "${name}"؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'نعم، استعادة',
        cancelButtonText: 'إلغاء'
      });

      if (!result.isConfirmed) return;

      try {
        await restoreEmployer(id);

        Swal.fire(
          'تمت الاستعادة!',
          'تم استعادة جهة العمل بنجاح.',
          'success'
        );

        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      } catch (err) {
        Swal.fire(
          'خطأ!',
          err.response?.data?.message || 'فشل استعادة جهة العمل',
          'error'
        );
      }
    },
    [queryClient]
  );

  const toggleShowArchived = () => {
    setShowArchived(prev => !prev);
    tableState.setPage(0);
  };

  // ========================================
  // DATA FETCHING
  // ========================================

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY, tableState.page, tableState.pageSize, tableState.sorting, showArchived, searchTerm],
    queryFn: async () => {
      const params = {
        page: tableState.page,
        size: tableState.pageSize,
        search: searchTerm // Backend now supports this
      };

      // Add Sorting
      if (tableState.sorting && tableState.sorting.length > 0) {
        const { id, desc } = tableState.sorting[0];
        params.sort = `${id},${desc ? 'desc' : 'asc'}`;
      }

      // Ensure backend receives 'deleted' param which maps to archived check
      if (showArchived) {
        params.deleted = true;
      }

      const result = await getEmployers(params);

      // Employers Service now returns { content: [], totalElements: num } or Array
      let content = [];
      let totalElements = 0;

      if (Array.isArray(result)) {
        content = result;
        totalElements = result.length;
      } else if (result?.content) {
        content = result.content;
        totalElements = result.totalElements;
      }

      return {
        content: content,
        totalElements: totalElements
      };
    },
    keepPreviousData: true
  });

  // ========================================
  // COLUMNS
  // ========================================

  const columns = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'الرمز',
        size: 100,
        cell: ({ row }) => (
          <Chip label={row.original?.code || '-'} size="small" variant="outlined" color="primary" />
        )
      },
      {
        accessorKey: 'name',
        header: 'الاسم',
        size: 200,
        align: 'right', // Align header to right
        muiTableHeadCellProps: {
          align: 'center', // Force header center
        },
        cell: ({ row }) => (
          <Stack direction="row" justifyContent="center" alignItems="center" sx={{ width: '100%', height: '100%' }}>
            <Typography variant="body2" fontWeight={500} textAlign="right">
              {row.original?.name}
            </Typography>
          </Stack>
        )
      },
      {
        accessorKey: 'active',
        header: 'الحالة',
        size: 90,
        cell: ({ row }) => (
          <Chip
            label={row.original?.active ? 'نشط' : 'غير نشط'}
            color={row.original?.active ? 'success' : 'default'}
            size="small"
            variant="light"
          />
        )
      },
      {
        id: 'linkedPolicy',
        header: 'الوثيقة المرتبطة',
        size: 180,
        align: 'center', // Changed to center
        cell: ({ row }) => {
          const { activePolicyName, activePolicyId, id } = row.original;

          if (activePolicyName) {
            return (
              <Stack direction="row" justifyContent="center" width="100%">
                <Tooltip title="فتح تفاصيل الوثيقة">
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/benefit-policies/${activePolicyId}`);
                    }}
                    startIcon={<PolicyIcon sx={{ fontSize: '1rem !important' }} />}
                    sx={{
                      fontWeight: 500,
                      textAlign: 'center',
                      justifyContent: 'center', // Center content
                      width: 'auto', // Auto width
                      px: 1
                    }}
                  >
                    <Typography variant="body2" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 150
                    }}>
                      {activePolicyName}
                    </Typography>
                  </Button>
                </Tooltip>
              </Stack>
            );
          }

          return (
            <Stack direction="row" justifyContent="center" width="100%">
              <Tooltip title="الانتقال لإنشاء وثيقة لهذه الجهة">
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    // For now redirect to list, maybe filtered?
                    navigate('/benefit-policies');
                  }}
                  startIcon={<DescriptionIcon sx={{ fontSize: '1rem !important', opacity: 0.6 }} />}
                  endIcon={<KeyboardArrowLeftIcon sx={{ fontSize: '0.8rem !important' }} />}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 'normal',
                    color: 'text.disabled'
                  }}
                >
                  لا توجد وثيقة
                </Button>
              </Tooltip>
            </Stack>
          );
        }
      },
      {
        id: 'actions',
        header: 'الإجراءات',
        size: 120,
        cell: ({ row }) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            {!showArchived && (
              <>
                <Tooltip title="تعديل سريع">
                  <IconButton size="small" color="primary" onClick={() => handleEditClick(row.original)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="حذف">
                  <IconButton size="small" color="error" onClick={() => handleDelete(row.original.id, row.original.name)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {showArchived && (
              <Tooltip title="استعادة">
                <IconButton size="small" color="success" onClick={() => handleRestore(row.original.id, row.original.name)}>
                  <RestoreFromTrashIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )
      }
    ],
    [handleEditClick, handleDelete, handleRestore, showArchived]
  );

  return (
    <Box>
      <UnifiedPageHeader
        title="إدارة جهات العمل"
        subtitle="إدخال وتعديل بيانات جهات العمل (الجهات المتعاقدة)"
        icon={BusinessCenterIcon}
        breadcrumbs={[{ label: 'الرئيسية', path: '/' }, { label: 'جهات العمل' }]}
        showAddButton={false}
        additionalActions={
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="بحث عن جهة عمل..."
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                sx: { backgroundColor: 'background.paper', borderRadius: 1 }
              }}
              sx={{ width: 250 }}
            />
            <Button
              variant={showArchived ? "contained" : "outlined"}
              color={showArchived ? "error" : "inherit"}
              startIcon={showArchived ? <RestoreFromTrashIcon /> : <DeleteIcon />}
              onClick={toggleShowArchived}
            >
              {showArchived ? 'عرض النشطة' : 'المحذوفات'}
            </Button>
          </Stack>
        }
      />

      {/* Layout Container: Form (Right) - Table (Left) */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          height: 'calc(100vh - 240px)',
          mt: 2,
          width: '100%'
        }}
      >

        {/* Right Column: Form (Fixed Width ~25%) */}
        <Box sx={{ width: { xs: '100%', md: '280px', lg: '320px' }, height: '100%', flexShrink: 0 }}>
          <MainCard
            title={formMode === 'create' ? 'إضافة جهة عمل جديدة' : 'تعديل بيانات جهة العمل'}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            contentSX={{ flex: 1, overflowY: 'auto' }}
          >
            <form onSubmit={handleSubmit} style={{ height: '100%' }}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                {formMode === 'create' && (
                  <Alert severity="info" icon={<AutoFixHighIcon />}>
                    يمكن ترك الرمز فارغاً للتوليد التلقائي
                  </Alert>
                )}

                <TextField
                  label="رمز جهة العمل (اختياري)"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  fullWidth
                  dir="ltr"
                  placeholder="EMP-001"
                />

                <TextField
                  label="اسم جهة العمل"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active}
                      onChange={handleInputChange}
                      name="active"
                      color="success"
                    />
                  }
                  label={formData.active ? 'الحساب نشط' : 'الحساب معطل'}
                />

                {/* Button placed naturally below inputs */}
                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
                  </Button>

                  {formMode === 'edit' && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      startIcon={<CancelIcon />}
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </Button>
                  )}
                </Stack>
              </Stack>
            </form>
          </MainCard>
        </Box>

        {/* Left Column: Table (Takes remaining space) */}
        <Box sx={{ flex: 1, height: '100%', minWidth: 0 }}>
          <MainCard
            content={false}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <GenericDataTable
                columns={columns}
                data={data?.content || []}
                totalCount={data?.totalElements || 0}
                isLoading={isLoading}
                tableState={tableState}
                enableFiltering={false}
                enableSorting={true}
                enablePagination={true}
                headerVariant="primary"
                cellPadding="dense"
                maxHeight="100%"
                emptyMessage={showArchived ? "سلة المحذوفات فارغة" : "لا يوجد شركاء مسجلين"}
                rowsPerPageOptions={[5, 8, 10, 15, 20, 25, 50]}
              />
            </Box>
          </MainCard>
        </Box>
      </Stack>

    </Box>
  );
};

export default EmployersList;
