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
  TableBody
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
  Undo as UndoIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import MainCard from 'components/MainCard';
import { GenericDataTable, ModernPageHeader, MemberAvatar } from 'components/tba';
import { useTableState } from 'hooks/useTableState';
import {
  getAllMembers,
  searchMembers,
  importMembers,
  detectColumns,
  previewImport,
  executeImport,
  downloadTemplate,
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
    initialPageSize: 15,
    defaultSort: DEFAULT_SORT
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
    organizationId: '',
    status: '',
    type: '',
    searchTerm: ''
  });
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Import Dialog State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [customMappings, setCustomMappings] = useState({});

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    html: false, // flag to render HTML content
    onConfirm: null,
    confirmText: 'نعم',
    cancelText: 'إلغاء',
    severity: 'warning'
  });

  // Lookup Data
  const [employers, setEmployers] = useState([]);

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
        'تم حذف المنتفع بنجاح',
        'خطأ في حذف المنتفع'
      )
    });
  };

  const handleRestoreClick = (member) => {
    setConfirmDialog({
      open: true,
      title: 'استعادة المنتفع؟',
      content: `سيتم استعادة المنتفع ${member.fullName} وإعادته للقائمة النشطة.`,
      severity: 'success',
      confirmText: 'نعم، استعده',
      onConfirm: () => handleConfirmAction(
        () => restoreMember(member.id),
        'تم استعادة المنتفع بنجاح',
        'خطأ في استعادة المنتفع'
      )
    });
  };

  const handleHardDeleteClick = (member) => {
    setConfirmDialog({
      open: true,
      title: 'حذف نهائي؟',
      content: `سيتم حذف المنتفع ${member.fullName} نهائياً من قاعدة البيانات. هذا الإجراء لا يمكن التراجع عنه!`,
      severity: 'error',
      confirmText: 'نعم، احذفه نهائياً',
      onConfirm: () => handleConfirmAction(
        () => hardDeleteMember(member.id),
        'تم حذف المنتفع نهائياً',
        'خطأ في الحذف النهائي للمنتفع'
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
      align: 'right'
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
                <IconButton size="small" color="success" onClick={() => handleRestoreClick(row.original)}>
                  <UndoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="حذف نهائي">
                <IconButton size="small" color="error" onClick={() => handleHardDeleteClick(row.original)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="عرض التفاصيل">
                <IconButton size="small" color="info" onClick={() => navigate(`/members/${row.original.id}`)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="تعديل">
                <IconButton size="small" color="primary" onClick={() => navigate(`/members/${row.original.id}/edit`)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="حذف">
                <IconButton size="small" color="error" onClick={() => handleDeleteClick(row.original)}>
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
        // Use search API with fullName parameter
        // Note: search API does not currently support sorting params in controller
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
        // Use getAllMembers API
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
      enqueueSnackbar('خطأ في جلب المنتفعين', { variant: 'error' });
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
      organizationId: '',
      status: '',
      type: '',
      searchTerm: ''
    });
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
    setImportFile(null);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportErrors(null);
    setActiveStep(0);
    setDetectionResults(null);
    setPreviewData(null);
    setExecutionResult(null);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImportFile(event.target.files[0]);
      setImportErrors(null); // Clear previous errors when selecting new file
    }
  };

  const handleNextStep = async () => {
    setImportErrors(null);
    if (activeStep === 0) {
      if (!importFile) return;
      setImporting(true);
      try {
        const result = await detectColumns(importFile);
        setDetectionResults(result.data);
        // Automatically move to preview with the detected header row
        const previewResult = await previewImport(importFile, customMappings, result.data.headerRowNumber);
        setPreviewData(previewResult.data);
        setActiveStep(2); // Skip step 1 (detection review) if it looks good, or just keep flow?
        // Actually, let's keep the steps but ensure preview is correct
      } catch (error) {
        console.error('Detection failed:', error);
        enqueueSnackbar('فشل تحليل الملف. تأكد أنه ملف Excel صالح.', { variant: 'error' });
      } finally {
        setImporting(false);
      }
    } else if (activeStep === 1) {
      setImporting(true);
      try {
        // Use the detection results' headerRowNumber
        const result = await previewImport(importFile, customMappings, detectionResults?.headerRowNumber);
        setPreviewData(result.data);
        setActiveStep(2);
      } catch (error) {
        console.error('Preview failed:', error);
        enqueueSnackbar('فشل معاينة البيانات.', { variant: 'error' });
      } finally {
        setImporting(false);
      }
    } else if (activeStep === 2) {
      handleImportSubmit();
    }
  };

  const handlePrevStep = () => {
    setImportErrors(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      // Execute the actual import
      // Note: In a real scenario, we might let the user select employerOrg from a list if it wasn't matched
      // For now, we assume the employer is pre-selected or matched in the file.
      // If the file doesn't have employer, we might need an extra step.

      setImportErrors(null);

      const params = {
        employerId: filters.organizationId || previewData?.availableEmployers?.[0]?.id,
        batchId: previewData?.batchId,
        headerRowNumber: detectionResults?.headerRowNumber
      };

      if (!params.employerId) {
        throw new Error('يرجى اختيار جهة العمل من القائمة الجانبية أو التأكد من وجود جهات عمل فعالة قبل البدء.');
      }

      const result = await executeImport(importFile, params);
      setExecutionResult(result.data);
      setActiveStep(3);

      // Refresh table
      fetchMembers();

      enqueueSnackbar('تمت عملية الاستيراد بنجاح', { variant: 'success' });
    } catch (error) {
      console.error('Import execution failed:', error);
      const errorMessage = error.response?.data?.message || 'فشل تنفيذ الاستيراد.';
      setImportErrors(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setImporting(false);
    }
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
        title="قائمة المنتفعين"
        icon={<FilterListIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'المنتفعين' }
        ]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant={showDeleted ? "contained" : "outlined"}
              color={showDeleted ? "warning" : "primary"}
              startIcon={showDeleted ? <VisibilityIcon /> : <DeleteIcon />}
              onClick={() => setShowDeleted(!showDeleted)}
              sx={{ fontSize: '12px' }}
            >
              {showDeleted ? 'العودة للقائمة النشطة' : 'المحذوفات'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ fontSize: '12px' }}
            >
              تحميل القالب
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={handleImportClick}
              sx={{ fontSize: '12px' }}
            >
              استيراد من إكسل
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/members/add')}
              sx={{ fontSize: '12px' }}
            >
              إنشاء منتفع رئيسي
            </Button>
          </Stack>
        }
      />

      <Stack spacing={2}>
        {/* Filters - Top Bar */}
        <MainCard sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
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
        </MainCard>

        {/* Data Table */}
        <MainCard content={false}>
          <GenericDataTable
            columns={columns}
            data={members}
            totalCount={totalElements}
            isLoading={loading}
            tableState={tableState}
            onRowClick={(row) => navigate(`/members/${row.id}`)}
          />
        </MainCard>
      </Stack>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>استيراد المنتفعين</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3, mt: 1 }}>
            <Step><StepLabel>اختيار الملف</StepLabel></Step>
            <Step><StepLabel>تحليل الأعمدة</StepLabel></Step>
            <Step><StepLabel>معاينة البيانات</StepLabel></Step>
            <Step><StepLabel>النتيجة</StepLabel></Step>
          </Stepper>

          {activeStep === 0 && (
            <Box textAlign="center" py={3}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                size="large"
              >
                اختيار ملف Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
              </Button>
              {importFile && (
                <Typography sx={{ mt: 2 }} variant="subtitle1">
                  تم اختيار: {importFile.name}
                </Typography>
              )}
            </Box>
          )}

          {activeStep === 1 && importFile && (
            <Box>
              <Typography>جاري تحليل الملف {importFile.name}...</Typography>
              <CircularProgress size={24} sx={{ mt: 2 }} />
            </Box>
          )}

          {activeStep === 2 && previewData && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                تم العثور على {previewData.totalRows} صفوف. سيتم الاستيراد إلى جهة العمل المختارة.
              </Alert>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {previewData.headers?.slice(0, 5).map((h, i) => <TableCell key={i}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.sampleRows?.slice(0, 3).map((row, i) => (
                    <TableRow key={i}>
                      {row.values?.slice(0, 5).map((val, j) => <TableCell key={j}>{val}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {activeStep === 3 && executionResult && (
            <Box textAlign="center">
              <Typography variant="h6" color="success.main" gutterBottom>
                تم الاستيراد بنجاح!
              </Typography>
              <Typography>
                تم استيراد {executionResult.importedCount} منتفع.
              </Typography>
            </Box>
          )}

          {importErrors && (
            <Alert severity="error" sx={{ mt: 2 }}>{importErrors}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>إغلاق</Button>
          {(activeStep === 0 || activeStep === 1 || activeStep === 2) && (
            <Button
              onClick={handleNextStep}
              variant="contained"
              disabled={activeStep === 0 && !importFile || importing}
            >
              {activeStep === 2 ? 'بدء الاستيراد' : 'التالي'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

export default UnifiedMembersList;