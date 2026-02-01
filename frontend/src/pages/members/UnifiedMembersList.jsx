/**
 * Unified Members List Page
 * 
 * Displays all members (Principals and Dependents) with pagination, sorting, and filtering.
 * Supports filtering by employer, status, and member type.
 * 
 * @module UnifiedMembersList
 * @since 2026-01-11
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Drawer,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import MainCard from 'components/MainCard';
import { GenericDataTable, ModernPageHeader, MemberAvatar } from 'components/tba';
import DataImportWizard from 'components/ExcelImport/DataImportWizard';
import DataExportWizard from 'components/tba/DataExportWizard';
import { useTableState } from 'hooks/useTableState';
import {
  getAllMembers,
  searchMembers,
  importMembers,
  detectColumns,
  previewImport,
  executeImport,
  getImportStatus,
  downloadTemplate,
  exportMembers,
  deleteMember,
  restoreMember,
  hardDeleteMember,
  MEMBER_TYPES,
  MEMBER_STATUSES
} from 'services/api/unified-members.service';
import axiosClient from 'utils/axios';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

const DEFAULT_SORT = { field: 'fullName', direction: 'asc' };

/**
 * Unified Members List Component
 */
const UnifiedMembersList = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Table State Management
  const tableState = useTableState({
    initialPageSize: 8, // Default to 8 records as requested
    defaultSort: DEFAULT_SORT,
    storageKey: 'members_table_page_size' // Per-table persistence to avoid conflicts
  });

  const {
    page,
    pageSize,
    sorting,
    setSorting
  } = tableState;

  // State
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [showDeleted, setShowDeleted] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    organizationId: '',
    type: '',
    status: ''
  });
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDependent, setSelectedDependent] = useState(null);

  // Export/Import Dialog States
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportWizardOpen, setExportWizardOpen] = useState(false);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    html: false,
    onConfirm: null,
    confirmText: 'نعم',
    cancelText: 'إلغاء',
    severity: 'warning'
  });

  // Lookup Data
  const [employers, setEmployers] = useState([]);

  // Common Header Button Style
  const headerButtonStyle = (type) => {
    const isExcel = type === 'excel';
    const isDelete = type === 'delete';
    const color = isExcel ? '#1b5e20' : (isDelete ? '#d32f2f' : undefined);

    return {
      minWidth: '155px',
      color: color || (type === 'add' ? '#fff' : 'primary.main'), // Fix color for contained button
      borderColor: color || 'primary.main',
      '&:hover': {
        backgroundColor: color ? `${color}10` : (type === 'add' ? '#144316' : undefined),
        borderColor: color || 'primary.main',
        color: isDelete && showDeleted ? '#fff' : (color || (type === 'add' ? '#fff' : 'primary.main'))
      },
      '&.MuiButton-contained': {
        color: '#fff' // Force white text for contained buttons
      },
      '& .MuiButton-startIcon': {
        '& .MuiSvgIcon-root': {
          fontSize: '22px'
        }
      },
      fontSize: '11px',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      px: 1.5,
      height: '40px'
    };
  };

  // EXPORT HANDLERS
  // ========================================
  const performExport = async (params) => {
    return await exportMembers(params);
  };

  // ========================================
  // CONFIRMATION HANDLERS
  // ========================================
  const closeDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  const handleConfirmAction = async (actionFn, successMessage, errorMessage) => {
    try {
      await actionFn();
      enqueueSnackbar(successMessage, { variant: 'success' });
      fetchMembers();
      closeDialog();
    } catch (error) {
      console.error(errorMessage, error);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleDeleteClick = (member) => {
    setConfirmDialog({
      open: true,
      title: 'هل أنت متأكد؟',
      content: member.type === 'PRINCIPAL'
        ? `سيتم حذف المنتفع ${member.fullName}. سيتم حذف جميع التابعين المرتبطين به أيضاً!`
        : `سيتم حذف المنتفع ${member.fullName}.`,
      html: false, // Simplified to text for standard dialog
      severity: 'error',
      confirmText: 'نعم، احذفه',
      onConfirm: () => handleConfirmAction(
        () => deleteMember(member.id),
        'تم حذف المستفيد بنجاح',
        'خطأ في حذف المستفيد'
      )
    });
  };

  const handleRestoreClick = (member) => {
    setConfirmDialog({
      open: true,
      title: 'استعادة المستفيد؟',
      content: `سيتم استعادة المستفيد ${member.fullName} وإعادته للقائمة النشطة.`,
      severity: 'success',
      confirmText: 'نعم، استعده',
      onConfirm: () => handleConfirmAction(
        () => restoreMember(member.id),
        'تم استعادة المستفيد بنجاح',
        'خطأ في استعادة المستفيد'
      )
    });
  };

  const handleHardDeleteClick = (member) => {
    setConfirmDialog({
      open: true,
      title: 'حذف نهائي؟',
      content: `سيتم حذف المستفيد ${member.fullName} نهائياً من قاعدة البيانات. هذا الإجراء لا يمكن التراجع عنه!`,
      severity: 'error',
      confirmText: 'نعم، احذفه نهائياً',
      onConfirm: () => handleConfirmAction(
        () => hardDeleteMember(member.id),
        'تم حذف المستفيد نهائياً',
        'خطأ في الحذف النهائي للمستفيد'
      )
    });
  };

  // ========================================
  // COLUMNS DEFINITION
  // ========================================
  const columns = React.useMemo(() => [
    {
      id: 'avatar',
      header: 'الصورة',
      size: 60,
      cell: ({ row }) => <MemberAvatar member={row.original} size={36} />
    },
    {
      accessorKey: 'cardNumber',
      header: 'رقم البطاقة',
      size: 130,
      cell: ({ getValue }) => (
        <Chip
          label={getValue() || '-'}
          variant="outlined"
          size="small"
          color="secondary"
          sx={{ fontWeight: 'medium', fontFamily: 'monospace' }}
        />
      )
    },
    {
      accessorKey: 'fullName',
      header: 'الاسم',
      size: 200,
      headerAlign: 'center', // Header title in the center
      align: 'right'        // Content to the right
    },
    {
      accessorKey: 'type',
      header: 'النوع',
      size: 90,
      cell: ({ getValue }) => getMemberTypeChip(getValue())
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      size: 90,
      cell: ({ getValue }) => getStatusChip(getValue())
    },
    {
      accessorKey: 'barcode',
      header: 'باركود',
      size: 130
    },
    {
      accessorKey: 'employerName', // Assuming employerName is flattened or handled
      header: 'جهة العمل',
      size: 150
    },
    // Calculated/Derived Columns
    {
      id: 'dependents',
      header: 'التابعون',
      size: 70,
      cell: ({ row }) => row.original.dependentsCount || 0
    },
    {
      id: 'actions',
      header: 'إجراءات',
      size: 110,
      cell: ({ row }) => (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          {showDeleted ? (
            <>
              <Tooltip title="استعادة">
                <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleRestoreClick(row.original); }}>
                  <UndoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="حذف نهائي">
                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleHardDeleteClick(row.original); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {row.original.type === MEMBER_TYPES.DEPENDENT && (
                <Tooltip title="بيانات التابع">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDependent(row.original);
                      setDrawerOpen(true);
                    }}
                  >
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="عرض التفاصيل">
                <IconButton size="small" color="info" onClick={(e) => { e.stopPropagation(); navigate(`/members/${row.original.id}`); }}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="تعديل">
                <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/members/${row.original.id}/edit`); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="حذف">
                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.original); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      )
    }
  ], [navigate, showDeleted]);

  // Fetch data on mount and filter change
  useEffect(() => {
    fetchMembers();
  }, [page, pageSize, filters, showDeleted, sorting]);

  useEffect(() => {
    fetchEmployers();
  }, []);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, searchTerm: localSearchTerm }));
      tableState.setPage(0);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  const fetchEmployers = async () => {
    try {
      // Use selectors endpoint for dropdown population - faster and lighter
      const response = await axiosClient.get('/employers/selectors');
      setEmployers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching employers:', error);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let response;
      // Fix: Split sort into field and direction for backend compatibility
      const sortField = sorting.length > 0 ? sorting[0].id : undefined;
      const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'DESC' : 'ASC') : undefined;

      const displayStatus = filters.status === '' ? undefined : filters.status;
      const displayType = filters.type === '' ? undefined : filters.type;
      const displayOrgId = filters.organizationId || undefined;

      if (filters.searchTerm && filters.searchTerm.trim()) {
        // Use search API with combined filters
        response = await searchMembers({
          fullName: filters.searchTerm.trim(),
          barcode: filters.searchTerm.trim(),
          cardNumber: filters.searchTerm.trim(),
          organizationId: displayOrgId,
          status: displayStatus,
          type: displayType,
          deleted: showDeleted,
          page: page,
          size: pageSize
        });
      } else {
        // Use getAllMembers API with combined filters
        response = await getAllMembers({
          page: page,
          size: pageSize,
          organizationId: displayOrgId,
          status: displayStatus,
          type: displayType,
          deleted: showDeleted,
          sort: sortField,
          direction: sortDirection
        });
      }

      console.log('Members response:', response);

      // Unified handling for both Page object and ApiResponse wrapper
      const pageData = response?.data || response;
      const data = pageData?.content || [];
      const total = pageData?.totalElements || 0;

      setMembers(data);
      setTotalElements(total);
    } catch (error) {
      console.error('Error fetching members:', error);
      enqueueSnackbar('خطأ في جلب المستفيدين', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    if (field === 'searchTerm') {
      setLocalSearchTerm(value);
    } else {
      setFilters((prev) => ({
        ...prev,
        [field]: value
      }));
      tableState.setPage(0); // Reset to first page
    }
  };

  const handleRefresh = () => {
    fetchMembers();
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      organizationId: '',
      type: '',
      status: ''
    });
    setLocalSearchTerm('');
    tableState.setPage(0);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'members_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      enqueueSnackbar('تم تحميل القالب بنجاح', { variant: 'success' });
    } catch (error) {
      console.error('Error downloading template:', error);
      enqueueSnackbar('فشل تحميل القالب', { variant: 'error' });
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    fetchMembers(); // Refresh in case import finished instantly
  };

  const getMemberTypeChip = (type) => {
    if (type === MEMBER_TYPES.PRINCIPAL) {
      return <Chip label="رئيسي" color="primary" size="small" sx={{ fontSize: '12px', height: 24, minWidth: '60px' }} />;
    }
    return <Chip label="تابع" color="secondary" size="small" sx={{ fontSize: '12px', height: 24, minWidth: '60px' }} />;
  };

  const getStatusChip = (status) => {
    const statusColors = {
      ACTIVE: 'success',
      SUSPENDED: 'warning',
      TERMINATED: 'error'
    };

    const statusLabels = {
      ACTIVE: 'نشط',
      SUSPENDED: 'معلق',
      TERMINATED: 'منتهي'
    };

    return (
      <Chip
        label={statusLabels[status] || status}
        color={statusColors[status] || 'default'}
        size="small"
        sx={{ fontSize: '12px', height: 24, minWidth: '80px' }}
      />
    );
  };

  return (
    <RBACGuard requiredPermissions={[PERMISSIONS.VIEW_MEMBERS]}>
      <ModernPageHeader
        title="قائمة المستفيدين"
        icon={<FilterListIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'المستفيدين' }
        ]}
        actions={
          <Stack direction="row" spacing={1} sx={{ '& .MuiButton-root': { transition: 'all 0.2s' } }}>
            {/* Excel Group */}
            <Button
              variant="outlined"
              onClick={handleDownloadTemplate}
              startIcon={<DownloadIcon />}
              sx={headerButtonStyle('excel')}
            >
              تحميل القالب
            </Button>
            <Button
              variant="outlined"
              onClick={handleImportClick}
              startIcon={<UploadFileIcon />}
              sx={headerButtonStyle('excel')}
            >
              استيراد من إكسل
            </Button>
            <Button
              variant="outlined"
              onClick={() => setExportWizardOpen(true)}
              startIcon={<FileDownloadIcon />}
              sx={headerButtonStyle('excel')}
            >
              تصدير لإكسل
            </Button>

            {/* View/Action Group */}
            <Button
              variant={showDeleted ? "contained" : "outlined"}
              startIcon={showDeleted ? <VisibilityIcon /> : <DeleteIcon />}
              onClick={() => setShowDeleted(!showDeleted)}
              sx={{
                ...headerButtonStyle('delete'),
                backgroundColor: showDeleted ? '#d32f2f' : 'transparent',
                color: showDeleted ? '#fff' : '#d32f2f',
                '&:hover': {
                  backgroundColor: showDeleted ? '#b71c1c' : '#d32f2f10',
                  color: showDeleted ? '#fff' : '#d32f2f',
                }
              }}
            >
              {showDeleted ? 'العودة للقائمة النشطة' : 'المحذوفات'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/members/add')}
              sx={headerButtonStyle('add')}
            >
              إضافة مستفيد
            </Button>
          </Stack>
        }
        sx={{ mb: 0.5 }} // Overrides default mb: 3 in ModernPageHeader
      />

      <Stack spacing={0.5} sx={{ flexGrow: 1, overflow: 'hidden', height: '100%' }}>
        {/* Filters - Top Bar */}
        <MainCard sx={{ p: 1, flexShrink: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              label="بحث السريع"
              placeholder="الاسم، باركود، رقم البطاقة..."
              value={localSearchTerm}
              onChange={handleFilterChange('searchTerm')}
              sx={{ minWidth: 200, flexGrow: 1 }}
              InputLabelProps={{ sx: { fontSize: '0.8125rem' } }}
              InputProps={{ sx: { fontSize: '0.8125rem', height: 36 } }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: '0.8125rem' }}>جهة العمل</InputLabel>
              <Select
                value={filters.organizationId}
                onChange={handleFilterChange('organizationId')}
                label="جهة العمل"
                sx={{ fontSize: '0.8125rem', height: 36 }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8125rem' }}><em>الكل</em></MenuItem>
                {employers.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: '0.8125rem' }}>{emp.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ fontSize: '0.8125rem' }}>النوع</InputLabel>
              <Select
                value={filters.type}
                onChange={handleFilterChange('type')}
                label="النوع"
                sx={{ fontSize: '0.8125rem', height: 36 }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8125rem' }}><em>الكل</em></MenuItem>
                <MenuItem value={MEMBER_TYPES.PRINCIPAL} sx={{ fontSize: '0.8125rem' }}>رئيسي</MenuItem>
                <MenuItem value={MEMBER_TYPES.DEPENDENT} sx={{ fontSize: '0.8125rem' }}>تابع</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ fontSize: '0.8125rem' }}>الحالة</InputLabel>
              <Select
                value={filters.status}
                onChange={handleFilterChange('status')}
                label="الحالة"
                sx={{ fontSize: '0.8125rem', height: 36 }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8125rem' }}><em>الكل</em></MenuItem>
                <MenuItem value={MEMBER_STATUSES.ACTIVE} sx={{ fontSize: '0.8125rem' }}>نشط</MenuItem>
                <MenuItem value={MEMBER_STATUSES.SUSPENDED} sx={{ fontSize: '0.8125rem' }}>معلق</MenuItem>
                <MenuItem value={MEMBER_STATUSES.TERMINATED} sx={{ fontSize: '0.8125rem' }}>منتهي</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="تحديث">
              <IconButton onClick={handleRefresh} size="small" color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="إعادة تعيين">
              <IconButton onClick={handleResetFilters} size="small">
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </MainCard >

        {/* Data Table with Flexible Height */}
        < MainCard content={false} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box
            sx={{
              flexGrow: 1,
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <GenericDataTable
              columns={columns}
              data={members}
              totalCount={totalElements}
              isLoading={loading}
              tableState={tableState}
              cellPadding="dense"
              enableFiltering={false} // Disable internal column filters
              onRowClick={(row) => navigate(`/members/${row.id}`)}
              rowsPerPageOptions={[8, 16, 24, 32]}
            />
          </Box>
        </MainCard >
      </Stack >

      < Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 350, p: 3 } }}
      >
        {selectedDependent && (
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight="bold">بيانات المستفيد</Typography>
            <Box>
              <Typography variant="caption" color="textSecondary">اسم الأصيل</Typography>
              <Typography variant="body1" fontWeight="medium">{selectedDependent.principalName || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">الحالة الاجتماعية</Typography>
              <Typography variant="body1" fontWeight="medium">{selectedDependent.maritalStatus || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">الجنسية</Typography>
              <Typography variant="body1" fontWeight="medium">{selectedDependent.nationality || '-'}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setDrawerOpen(false)}>إغلاق</Button>
          </Stack>
        )}
      </Drawer >

      {/* Import Wizard */}
      < DataImportWizard open={importDialogOpen} onClose={handleCloseImportDialog} />

      {/* Confirmation Dialog */}
      < Dialog
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
      </Dialog >

      <DataExportWizard
        open={exportWizardOpen}
        onClose={() => setExportWizardOpen(false)}
        onExport={performExport}
        title="تصدير بيانات المستفيدين"
        fileName={`members-export-${new Date().toISOString().split('T')[0]}.xlsx`}
        params={{
          searchTerm: filters.searchTerm,
          organizationId: filters.organizationId || undefined,
          status: filters.status || undefined,
          type: filters.type || undefined,
          deleted: showDeleted
        }}
      />
    </RBACGuard >
  );
};

export default UnifiedMembersList;
