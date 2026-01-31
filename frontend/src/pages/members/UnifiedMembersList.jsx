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

import Swal from 'sweetalert2';

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
import { openSnackbar } from 'api/snackbar';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

const DEFAULT_SORT = { field: 'fullName', direction: 'asc' };

/**
 * Unified Members List Component
 */
const UnifiedMembersList = () => {
  const navigate = useNavigate();

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

  // Delete Dialog State - REMOVED (Replaced by SweetAlert2)
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [memberToDelete, setMemberToDelete] = useState(null);
  // const [deleting, setDeleting] = useState(false);

  // Lookup Data
  const [employers, setEmployers] = useState([]);

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
      openSnackbar({
        open: true,
        message: 'خطأ في جلب المنتفعين',
        variant: 'alert',
        alert: { color: 'error' }
      });
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



  const handleDeleteClick = (member) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      html: `سيتم حذف المنتفع <strong>${member.fullName}</strong>.<br/>${member.type === 'PRINCIPAL' ? '<span style="color:red">⚠️ سيتم حذف جميع التابعين المرتبطين به أيضاً!</span>' : ''}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteMember(member.id);
          openSnackbar({
            open: true,
            message: 'تم حذف المنتفع بنجاح',
            variant: 'alert',
            alert: { color: 'success' }
          });
          fetchMembers();
        } catch (error) {
          console.error('Error deleting member:', error);
          openSnackbar({
            open: true,
            message: 'خطأ في حذف المنتفع',
            variant: 'alert',
            alert: { color: 'error' }
          });
        }
      }
    });
  };

  const handleRestoreClick = (member) => {
    Swal.fire({
      title: 'استعادة المنتفع؟',
      html: `سيتم استعادة المنتفع <strong>${member.fullName}</strong> وإعادته للقائمة النشطة.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، استعده',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await restoreMember(member.id);
          openSnackbar({
            open: true,
            message: 'تم استعادة المنتفع بنجاح',
            variant: 'alert',
            alert: { color: 'success' }
          });
          fetchMembers();
        } catch (error) {
          console.error('Error restoring member:', error);
          openSnackbar({
            open: true,
            message: 'خطأ في استعادة المنتفع',
            variant: 'alert',
            alert: { color: 'error' }
          });
        }
      }
    });
  };

  const handleHardDeleteClick = (member) => {
    Swal.fire({
      title: 'حذف نهائي؟',
      html: `سيتم حذف المنتفع <strong>${member.fullName}</strong> نهائياً من قاعدة البيانات.<br/><span style="color:red; font-weight:bold">⚠️ هذا الإجراء لا يمكن التراجع عنه!</span>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه نهائياً',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await hardDeleteMember(member.id);
          openSnackbar({
            open: true,
            message: 'تم حذف المنتفع نهائياً',
            variant: 'alert',
            alert: { color: 'success' }
          });
          fetchMembers();
        } catch (error) {
          console.error('Error hard deleting member:', error);
          openSnackbar({
            open: true,
            message: 'خطأ في الحذف النهائي للمنتفع',
            variant: 'alert',
            alert: { color: 'error' }
          });
        }
      }
    });
  };

  // handleConfirmDelete is no longer needed

  const handleRestore = async (member) => {
    const result = await Swal.fire({
      title: 'تأكيد الاستعادة',
      text: `هل تريد استعادة المنتفع "${member.fullName}"؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم، استعادة',
      cancelButtonText: 'إلغاء'
    });

    if (!result.isConfirmed) return;

    try {
      await restoreMember(member.id);
      openSnackbar({
        open: true,
        message: 'تم استعادة المنتفع بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });
      fetchMembers();
    } catch (error) {
      console.error('Error restoring member:', error);
      openSnackbar({
        open: true,
        message: 'خطأ في استعادة المنتفع',
        variant: 'alert',
        alert: { color: 'error' }
      });
    }
  };

  const handleRefresh = () => {
    fetchMembers();
  };

  // Helper function to translate column names to Arabic
  const translateColumnName = (columnName) => {
    const translations = {
      'full_name': 'الاسم الكامل',
      'employer': 'جهة العمل',
      'birth_date': 'تاريخ الميلاد',
      'gender': 'الجنس',
      'civil_id': 'الرقم الوطني',
      'phone': 'رقم الهاتف',
      'email': 'البريد الإلكتروني',
      'policy_number': 'رقم الوثيقة',
      'nationality': 'الجنسية',
      'employee_number': 'الرقم الوظيفي',
      'TEMPLATE_HEADER': 'رأس القالب'
    };
    return translations[columnName] || columnName;
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
      openSnackbar({
        open: true,
        message: 'تم تحميل القالب بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      openSnackbar({
        open: true,
        message: 'فشل تحميل القالب',
        variant: 'alert',
        alert: { color: 'error' }
      });
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
        openSnackbar({
          open: true,
          message: 'فشل تحليل الملف. تأكد أنه ملف Excel صالح.',
          variant: 'alert',
          alert: { color: 'error' }
        });
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
        openSnackbar({
          open: true,
          message: 'فشل معاينة البيانات.',
          variant: 'alert',
          alert: { color: 'error' }
        });
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

      openSnackbar({
        open: true,
        message: 'تمت عملية الاستيراد بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });
    } catch (error) {
      console.error('Import execution failed:', error);
      const errorMessage = error.response?.data?.message || 'فشل تنفيذ الاستيراد.';
      setImportErrors(errorMessage);
      openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' }
      });
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

            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              sx={{ height: 36, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
            >
              إعادة تعيين
            </Button>

            <IconButton color="primary" onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Stack>
        </MainCard>

        {/* Members Table - Full Width */}
        <MainCard
          content={false}
          sx={{ height: 'calc(100vh - 380px)', display: 'flex', flexDirection: 'column' }}
        >
          <GenericDataTable
            columns={columns}
            data={members}
            totalCount={totalElements}
            isLoading={loading}
            tableState={tableState}
            emptyMessage="لا يوجد منتفعين"
            headerVariant="primary"
            enableFiltering={false}
          />
        </MainCard>
      </Stack>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>استيراد قائمة المنتفعين</Typography>
          <IconButton onClick={handleCloseImportDialog} size="small"><RefreshIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          <Box sx={{ p: 1 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              <Step><StepLabel>اختيار الملف</StepLabel></Step>
              <Step><StepLabel>تحليل الأعمدة</StepLabel></Step>
              <Step><StepLabel>معاينة البيانات</StepLabel></Step>
              <Step><StepLabel>النتائج</StepLabel></Step>
            </Stepper>

            {importErrors && (
              <Alert severity="error" sx={{ mb: 3, fontWeight: 700 }}>
                {importErrors}
              </Alert>
            )}

            {activeStep === 0 && (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="info" sx={{ mb: 3, textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>تعليمات:</Typography>
                  <Typography variant="body2">
                    • استخدم القالب القياسي لضمان أفضل النتائج.<br />
                    • الاسم الكامل حقل إلزامي.<br />
                    • سيتم التعرف على التكرارات آلياً وتحديث بياناتهم.
                  </Typography>
                </Alert>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                  sx={{ height: 120, borderStyle: 'dashed', borderWidth: 2 }}
                >
                  {importFile ? importFile.name : 'اسحب ملف الإكسل هنا أو اضغط للاختيار'}
                  <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
                </Button>
                {importFile && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    تم اختيار: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </Typography>
                )}
              </Box>
            )}

            {activeStep === 1 && detectionResults && (
              <Box>
                <Alert severity={detectionResults.missingRequiredFields?.length > 0 ? "error" : "success"} sx={{ mb: 2 }}>
                  {detectionResults.missingRequiredFields?.length > 0
                    ? `تنبيه: حقول إلزامية مفقودة: ${detectionResults.missingRequiredFields.join(', ')}`
                    : "تم تحليل بنية الملف بنجاح."}
                </Alert>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>مطابقة الأعمدة المكتشفة:</Typography>
                <Table size="small" sx={{ border: '1px solid #eee' }}>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>اسم العمود في الملف</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>الحقل المقابل في النظام</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>الدقة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detectionResults.suggestions?.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{s.columnName || '---'}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.suggestedFieldLabelAr || 'غير معروف'}
                            color={s.suggestedField ? "primary" : "default"}
                            variant={s.suggestedField ? "filled" : "outlined"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color={s.confidence > 0.8 ? "success.main" : "warning.main"}>
                            {Math.round(s.confidence * 100)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {activeStep === 2 && previewData && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  مراجعة عينة من البيانات قبل البدء الفعلي للاستيراد.
                </Alert>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>الاسم</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>الرقم الوطني</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>جهة العمل</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>الحالة المتوقعة</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.previewRows?.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.fullName || '---'}</TableCell>
                          <TableCell>{row.nationalNumber || '---'}</TableCell>
                          <TableCell>{row.employerName || 'محدد مسبقاً'}</TableCell>
                          <TableCell>
                            {row.errors?.length > 0 ? (
                              <Chip label="يحتوي أخطاء" color="error" size="small" variant="outlined" />
                            ) : (
                              <Chip label="جاهز" color="success" size="small" variant="outlined" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                {previewData.rows?.length > 5 && (
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                    يتم عرض أول 5 سجلات فقط من إجمالي {previewData.summary?.totalRows} سجل
                  </Typography>
                )}
              </Box>
            )}

            {activeStep === 3 && executionResult && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" color="success.main" gutterBottom sx={{ fontWeight: 700 }}>
                    اكتملت العملية بنجاح!
                  </Typography>
                  <Typography variant="body1">{executionResult.message}</Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 4 }}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4">{executionResult.summary?.created || 0}</Typography>
                      <Typography variant="body2">سجلات جديدة</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h4">{executionResult.summary?.updated || 0}</Typography>
                      <Typography variant="body2">تم تحديثها</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'white' }}>
                      <Typography variant="h4">{executionResult.summary?.failed || 0}</Typography>
                      <Typography variant="body2">فشلت</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {executionResult.errors?.length > 0 && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" color="error" gutterBottom sx={{ fontWeight: 700 }}>الأخطاء المكتشفة:</Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', p: 1 }}>
                      {executionResult.errors.map((err, idx) => (
                        <Typography key={idx} variant="caption" component="div" sx={{ borderBottom: '1px solid #fafafa', py: 0.5 }}>
                          الصف {err.rowNumber}: {err.messageAr || err.messageEn}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {importing && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {activeStep === 0 ? (
            <>
              <Button onClick={handleCloseImportDialog}>إلغاء</Button>
              <Button variant="contained" onClick={handleNextStep} disabled={!importFile || importing}>الخطوة التالية</Button>
            </>
          ) : activeStep === 3 ? (
            <Button variant="contained" onClick={handleCloseImportDialog}>إغلاق</Button>
          ) : (
            <>
              <Button onClick={handlePrevStep} disabled={importing}>السابق</Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button variant="contained" onClick={handleNextStep} disabled={importing}>
                {activeStep === 2 ? 'بدء الاستيراد الفعلي' : 'الخطوة التالية'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </RBACGuard>
  );
};

export default UnifiedMembersList;