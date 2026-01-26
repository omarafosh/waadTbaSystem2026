/**
 * Unified Members List Page
 * 
 * Displays all members (Principals and Dependents) with pagination, sorting, and filtering.
 * Supports filtering by employer, status, and member type.
 * 
 * @module UnifiedMembersList
 * @since 2026-01-11
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
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
  Download as DownloadIcon
} from '@mui/icons-material';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { 
  getAllMembers, 
  searchMembers, 
  importMembers, 
  downloadTemplate, 
  MEMBER_TYPES, 
  MEMBER_STATUSES 
} from 'services/api/unified-members.service';
import axiosClient from 'utils/axios';
import { openSnackbar } from 'api/snackbar';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

/**
 * Unified Members List Component
 */
const UnifiedMembersList = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [showDeleted, setShowDeleted] = useState(false);
  const [filters, setFilters] = useState({
    organizationId: '',
    status: '',
    type: '',
    searchTerm: ''
  });

  // Import Dialog State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState(null); // Store import errors for display

  // Lookup Data
  const [employers, setEmployers] = useState([]);

  // Fetch data on mount and filter change
  useEffect(() => {
    fetchMembers();
  }, [page, rowsPerPage, filters, showDeleted]);

  useEffect(() => {
    fetchEmployers();
  }, []);

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

      if (filters.searchTerm && filters.searchTerm.trim()) {
        // Use search API with fullName parameter
        response = await searchMembers({
          fullName: filters.searchTerm.trim(),
          barcode: filters.searchTerm.trim(),
          cardNumber: filters.searchTerm.trim(),
          organizationId: filters.organizationId || undefined,
          status: filters.status || undefined,
          type: filters.type || undefined,
          deleted: showDeleted,
          page,
          size: rowsPerPage
        });
      } else {
        // Use getAllMembers API
        response = await getAllMembers({
          page,
          size: rowsPerPage,
          organizationId: filters.organizationId || undefined,
          status: filters.status || undefined,
          type: filters.type || undefined,
          deleted: showDeleted
        });
      }

      console.log('Members response:', response);

      // Service returns response.data directly (Spring Page object)
      // So response = {content, totalElements, ...}
      const data = response?.content || [];
      const total = response?.totalElements || 0;

      setMembers(data);
      setTotalElements(total);
    } catch (error) {
      console.error('Error fetching members:', error);
      openSnackbar({
        open: true,
        message: 'خطأ في جلب المؤمن عليهم',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
    setPage(0); // Reset to first page
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
    setPage(0);
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
    setImportErrors(null); // Clear errors when closing
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImportFile(event.target.files[0]);
      setImportErrors(null); // Clear previous errors when selecting new file
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportErrors(null);
    
    try {
      const result = await importMembers(importFile);
      setImportDialogOpen(false);
      
      // Reset to first page to ensure new records are visible (sorted by ID DESC)
      if (page === 0) {
        fetchMembers();
      } else {
        setPage(0); // This will trigger useEffect which calls fetchMembers
      }

      const summary = result?.data?.summary;
      const successMsg = summary 
        ? `تم استيراد ${summary.created || 0} عضو بنجاح`
        : 'تم استيراد الملف بنجاح';

      openSnackbar({
        open: true,
        message: successMsg,
        variant: 'alert',
        alert: { color: 'success' }
      });
    } catch (error) {
      console.error('Error importing members:', error);
      
      // Extract import result from error
      const importResult = error.importResult || error.response?.data?.data;
      const serverMessage = error.serverMessage || error.response?.data?.message;
      
      if (importResult?.errors?.length > 0) {
        // Show detailed errors in dialog
        setImportErrors({
          message: serverMessage || 'فشل الاستيراد',
          summary: importResult.summary,
          errors: importResult.errors.slice(0, 20) // Show first 20 errors
        });
      } else {
        // Show simple error message
        openSnackbar({
          open: true,
          message: serverMessage || 'فشل استيراد الملف، يرجى التأكد من صحة البيانات',
          variant: 'alert',
          alert: { color: 'error' }
        });
      }
    } finally {
      setImporting(false);
    }
  };

  const getMemberTypeChip = (type) => {
    if (type === MEMBER_TYPES.PRINCIPAL) {
      return <Chip label="رئيسي" color="primary" size="small" sx={{ fontSize: '12px', height: 24 }} />;
    }
    return <Chip label="تابع" color="secondary" size="small" sx={{ fontSize: '12px', height: 24 }} />;
  };

  const getStatusChip = (status) => {
    const statusColors = {
      ACTIVE: 'success',
      SUSPENDED: 'warning',
      TERMINATED: 'error'
    };

    return (
      <Chip
        label={status}
        color={statusColors[status] || 'default'}
        size="small"
        sx={{ fontSize: '12px', height: 24 }}
      />
    );
  };

  return (
    <RBACGuard requiredPermissions={[PERMISSIONS.VIEW_MEMBERS]}>
      <ModernPageHeader
        title="قائمة المؤمن عليهم"
        icon={<FilterListIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'المؤمن عليهم' }
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
              إنشاء مؤمن رئيسي
            </Button>
          </Stack>
        }
      />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'stretch' }}>
        {/* Filters - Right Column */}
        <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
          <MainCard sx={{ p: 2, height: 'calc(100vh - 240px)', overflowY: 'auto' }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="بحث"
                placeholder="الاسم، باركود، رقم البطاقة..."
                value={filters.searchTerm}
                onChange={handleFilterChange('searchTerm')}
                InputLabelProps={{ sx: { fontSize: '0.8125rem' } }}
                InputProps={{ sx: { fontSize: '0.8125rem', height: 38 } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8125rem' }}>جهة العمل</InputLabel>
                <Select
                  value={filters.organizationId}
                  onChange={handleFilterChange('organizationId')}
                  label="جهة العمل"
                  sx={{ fontSize: '0.8125rem', height: 38 }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8125rem' }}>
                    <em>الكل</em>
                  </MenuItem>
                  {employers.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: '0.8125rem' }}>
                      {emp.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8125rem' }}>النوع</InputLabel>
                <Select
                  value={filters.type}
                  onChange={handleFilterChange('type')}
                  label="النوع"
                  sx={{ fontSize: '0.8125rem', height: 38 }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8125rem' }}>
                    <em>الكل</em>
                  </MenuItem>
                  <MenuItem value={MEMBER_TYPES.PRINCIPAL} sx={{ fontSize: '0.8125rem' }}>رئيسي</MenuItem>
                  <MenuItem value={MEMBER_TYPES.DEPENDENT} sx={{ fontSize: '0.8125rem' }}>تابع</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8125rem' }}>الحالة</InputLabel>
                <Select
                  value={filters.status}
                  onChange={handleFilterChange('status')}
                  label="الحالة"
                  sx={{ fontSize: '0.8125rem', height: 38 }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8125rem' }}>
                    <em>الكل</em>
                  </MenuItem>
                  <MenuItem value={MEMBER_STATUSES.ACTIVE} sx={{ fontSize: '0.8125rem' }}>نشط</MenuItem>
                  <MenuItem value={MEMBER_STATUSES.SUSPENDED} sx={{ fontSize: '0.8125rem' }}>معلق</MenuItem>
                  <MenuItem value={MEMBER_STATUSES.TERMINATED} sx={{ fontSize: '0.8125rem' }}>منتهي</MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                sx={{ height: 38, fontSize: '0.8125rem' }}
              >
                إعادة تعيين
              </Button>
            </Stack>
          </MainCard>
        </Box>

        {/* Members Table */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <MainCard
            content={false}
            sx={{ height: 'calc(100vh - 240px)', display: 'flex', flexDirection: 'column' }}
          >
            <TableContainer component={Paper} elevation={0} sx={{ flexGrow: 1, overflow: 'auto' }}>
              <Table sx={{ minWidth: 1000 }} aria-label="unified members table" stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '4%' }}>#</TableCell>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '20%' }}>الاسم</TableCell>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '10%' }}>النوع</TableCell>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '10%' }}>الحالة</TableCell>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '12%' }}>رقم البطاقة</TableCell>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '12%' }}>باركود</TableCell>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '17%' }}>جهة العمل</TableCell>
                    <TableCell sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '5%' }}>التابعون</TableCell>
                    <TableCell align="center" sx={{ color: 'common.white', bgcolor: 'primary.main', fontWeight: 600, fontSize: '12px', py: 1.5, width: '10%' }}>إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          جاري تحميل المؤمن عليهم...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ height: '400px' }}>
                         <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                            <Typography color="text.secondary" sx={{ fontSize: '12px', fontWeight: 600 }}>
                              لا توجد نتائج
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => navigate('/members/add')}
                              sx={{ mt: 2, fontSize: '12px' }}
                            >
                              إنشاء مؤمن رئيسي
                            </Button>
                         </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member, index) => (
                      <TableRow key={member.id}>
                        <TableCell sx={{ fontSize: '12px' }}>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" fontSize="12px">
                            {member.fullName}
                          </Typography>
                          {member.nationalNumber && (
                            <Typography variant="caption" color="text.secondary" fontSize="12px">
                              {member.nationalNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px' }}>{getMemberTypeChip(member.type)}</TableCell>
                        <TableCell sx={{ fontSize: '12px' }}>{getStatusChip(member.status)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="12px">
                            {member.cardNumber || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {member.barcode ? (
                            <Tooltip title="للرئيسي فقط">
                              <Chip
                                label={member.barcode}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '12px' }}
                              />
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="12px">
                            {member.employerName || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {member.type === MEMBER_TYPES.PRINCIPAL ? (
                            <Chip
                              label={member.dependentsCount || 0}
                              size="small"
                              color={member.dependentsCount > 0 ? 'success' : 'default'}
                              sx={{ height: 20, fontSize: '12px' }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="عرض">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/members/${member.id}`)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="تعديل">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => navigate(`/members/${member.id}/edit`)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
              <TablePagination
                component="div"
                count={totalElements}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="عدد الصفوف:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
                }
                sx={{
                  '.MuiTablePagination-selectLabel': { fontSize: '12px' },
                  '.MuiTablePagination-displayedRows': { fontSize: '12px' },
                  '.MuiTablePagination-select': { fontSize: '12px' },
                  '.MuiTablePagination-menuItem': { fontSize: '12px' }
                }}
              />
            </Box>
          </MainCard>
        </Box>
      </Box>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '14px', fontWeight: 700 }}>استيراد قائمة المؤمن عليهم</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            {!importErrors ? (
              // File selection view
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 2, textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ⚠️ متطلبات مهمة قبل الرفع:
                  </Typography>
                  <Typography variant="body2" component="div">
                    • الاسم الكامل (fullName) <strong>إلزامي</strong><br/>
                    • جهة العمل (employerName) <strong>إلزامي</strong> - يجب أن يطابق اسم شريك موجود<br/>
                    • استخدم القالب الرسمي فقط (اضغط "تحميل القالب" من الأعلى)<br/>
                    • تأكد من صحة التواريخ والبيانات
                  </Typography>
                </Alert>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  يمكنك استيراد قائمة بالمؤمن عليهم باستخدام ملف Excel.
                  يرجى التأكد من استخدام القالب القياسي لتجنب الأخطاء.
                </Typography>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                  sx={{ height: 100, borderStyle: 'dashed', borderWidth: 2 }}
                >
                  {importFile ? importFile.name : 'اختر ملف Excel (.xlsx)'}
                  <input
                    type="file"
                    hidden
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />
                </Button>
                
                {importFile && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    تم اختيار الملف: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                  </Alert>
                )}

                {importing && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
              </Box>
            ) : (
              // Error details view
              <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <strong>{importErrors.message}</strong>
                  {importErrors.summary && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      الإجمالي: {importErrors.summary.totalRows || 0} صف | 
                      نجح: {importErrors.summary.created || 0} | 
                      فشل: {(importErrors.summary.rejected || 0) + (importErrors.summary.failed || 0)}
                    </Typography>
                  )}
                </Alert>
                
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  تفاصيل الأخطاء (أول {importErrors.errors?.length || 0} خطأ):
                </Typography>
                
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>الصف</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>العمود</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>الخطأ</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>القيمة</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importErrors.errors?.map((err, idx) => (
                        <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                          <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {err.rowNumber || '-'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {translateColumnName(err.columnName) || '-'}
                          </TableCell>
                          <TableCell>{err.messageAr || err.messageEn || 'خطأ غير محدد'}</TableCell>
                          <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {err.value || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>نصيحة:</strong> تأكد من استخدام القالب الرسمي للنظام وأن أسماء جهات العمل تطابق القيم في ورقة "Employers"
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {importErrors ? (
            // Error view actions
            <>
              <Button onClick={() => setImportErrors(null)} color="primary">
                اختيار ملف آخر
              </Button>
              <Button onClick={handleCloseImportDialog} variant="outlined">
                إغلاق
              </Button>
            </>
          ) : (
            // Normal view actions
            <>
              <Button onClick={handleCloseImportDialog} disabled={importing}>
                إلغاء
              </Button>
              <Button 
                onClick={handleImportSubmit} 
                variant="contained" 
                disabled={!importFile || importing}
              >
                {importing ? 'جاري الاستيراد...' : 'استيراد'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </RBACGuard>
  );
};

export default UnifiedMembersList;