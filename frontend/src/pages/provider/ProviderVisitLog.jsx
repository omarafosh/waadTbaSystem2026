import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Material UI
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Collapse
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EventIcon from '@mui/icons-material/Event';

// Services
import { providerApi } from 'services/providerService';

// Components
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';

// ========================= LABELS (Arabic) =========================
const LABELS = {
  pageTitle: 'سجل الزيارات',
  pageSubtitle: 'إدارة ومتابعة زيارات المرضى',
  visitId: 'رقم الزيارة',
  memberName: 'اسم المريض',
  civilId: 'الرقم المدني',
  cardNumber: 'رقم البطاقة',
  visitDate: 'تاريخ الزيارة',
  visitType: 'نوع الزيارة',
  status: 'الحالة',
  employer: 'جهة العمل',
  diagnosis: 'التشخيص',
  actions: 'الإجراءات',
  createClaim: 'إنشاء مطالبة',
  createPreAuth: 'إنشاء موافقة مسبقة',
  viewDetails: 'عرض التفاصيل',
  printVisit: 'طباعة تقرير الزيارة',
  refresh: 'تحديث',
  search: 'بحث...',
  searchByName: 'بحث بالاسم أو الرقم المدني',
  filters: 'فلاتر البحث',
  hideFilters: 'إخفاء الفلاتر',
  showFilters: 'عرض الفلاتر',
  dateFrom: 'من تاريخ',
  dateTo: 'إلى تاريخ',
  allStatuses: 'جميع الحالات',
  allTypes: 'جميع الأنواع',
  noData: 'لا توجد زيارات مسجلة',
  loading: 'جارِ التحميل...',
  error: 'حدث خطأ أثناء جلب البيانات',
  rowsPerPage: 'صفوف لكل صفحة',
  pdfPreview: 'معاينة التقرير',
  print: 'طباعة',
  download: 'تحميل PDF',
  close: 'إغلاق',
  visitSummary: 'ملخص الزيارة',
  memberInfo: 'بيانات المريض',
  visitInfo: 'بيانات الزيارة',
  medicalInfo: 'البيانات الطبية',
  linkedRecords: 'السجلات المرتبطة',
  claims: 'المطالبات',
  preAuths: 'الموافقات المسبقة',
  claimStatus: 'حالة المطالبة',
  preAuthStatus: 'حالة الموافقة',
  noClaim: 'لا توجد',
  noPreAuth: 'لا توجد'
};

// ========================= STATUS CONFIGS =========================
const STATUS_COLORS = {
  REGISTERED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
  PENDING: 'default'
};

const STATUS_LABELS = {
  REGISTERED: 'مسجلة',
  IN_PROGRESS: 'قيد المعالجة',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  PENDING: 'معلقة'
};

// ========================= CLAIM STATUS CONFIGS =========================
const CLAIM_STATUS_COLORS = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  PARTIALLY_APPROVED: 'warning',
  REJECTED: 'error',
  SETTLED: 'success',
  PAID: 'success',
  CANCELLED: 'default'
};

const CLAIM_STATUS_LABELS = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مقدمة',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'موافق عليها',
  PARTIALLY_APPROVED: 'موافقة جزئية',
  REJECTED: 'مرفوضة',
  SETTLED: 'مسددة',
  PAID: 'مدفوعة',
  CANCELLED: 'ملغاة'
};

// ========================= PRE-AUTH STATUS CONFIGS =========================
const PREAUTH_STATUS_COLORS = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  PENDING: 'warning',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  PARTIALLY_APPROVED: 'warning',
  REJECTED: 'error',
  EXPIRED: 'default',
  CANCELLED: 'default'
};

const PREAUTH_STATUS_LABELS = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مقدمة',
  PENDING: 'معلقة',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'موافق عليها',
  PARTIALLY_APPROVED: 'موافقة جزئية',
  REJECTED: 'مرفوضة',
  EXPIRED: 'منتهية',
  CANCELLED: 'ملغاة'
};

const VISIT_TYPE_LABELS = {
  OUTPATIENT: 'عيادة خارجية',
  INPATIENT: 'تنويم',
  EMERGENCY: 'طوارئ',
  DAY_CARE: 'رعاية يومية'
};

// ========================= PDF PREVIEW COMPONENT =========================
const VisitPdfPreviewDialog = ({ open, onClose, visit }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الزيارة - ${visit?.visitId || ''}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #1976d2;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0;
          }
          .visit-id {
            background: #e3f2fd;
            padding: 10px 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .visit-id span {
            font-size: 20px;
            font-weight: bold;
            color: #1565c0;
          }
          .section {
            margin-bottom: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
          }
          .section-title {
            background: #f5f5f5;
            padding: 10px 15px;
            font-weight: bold;
            border-bottom: 1px solid #e0e0e0;
          }
          .section-content {
            padding: 15px;
          }
          .row {
            display: flex;
            margin-bottom: 10px;
          }
          .label {
            min-width: 150px;
            font-weight: 500;
            color: #666;
          }
          .value {
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-REGISTERED { background: #e3f2fd; color: #1565c0; }
          .status-IN_PROGRESS { background: #fff3e0; color: #e65100; }
          .status-COMPLETED { background: #e8f5e9; color: #2e7d32; }
          .status-CANCELLED { background: #ffebee; color: #c62828; }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    // For now, trigger print which can save as PDF
    handlePrint();
  };

  if (!visit) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PictureAsPdfIcon color="error" />
          <Typography variant="h5">{LABELS.pdfPreview}</Typography>
        </Stack>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Print Content */}
        <Box ref={printRef} sx={{ p: 2 }}>
          {/* Header */}
          <Box className="header" sx={{ textAlign: 'center', borderBottom: '2px solid #1976d2', pb: 2, mb: 3 }}>
            <Typography variant="h4" color="primary" fontWeight="bold">تقرير الزيارة الطبية</Typography>
            <Typography color="textSecondary">نظام إدارة التأمين الطبي - TBA</Typography>
          </Box>

          {/* Visit ID Badge */}
          <Box className="visit-id" sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2, textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" color="primary">
              رقم الزيارة: <strong>#{visit.visitId}</strong>
            </Typography>
          </Box>

          {/* Member Info Section */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon color="primary" />
                <Typography fontWeight="bold">{LABELS.memberInfo}</Typography>
              </Stack>
            </Box>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.memberName}</Typography>
                  <Typography fontWeight="500">{visit.memberName || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.civilId}</Typography>
                  <Typography fontWeight="500" sx={{ fontFamily: 'monospace' }}>{visit.memberCivilId || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.cardNumber}</Typography>
                  <Typography fontWeight="500" sx={{ fontFamily: 'monospace' }}>{visit.memberCardNumber || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.employer}</Typography>
                  <Typography fontWeight="500">{visit.employerName || '-'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Visit Info Section */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalHospitalIcon color="primary" />
                <Typography fontWeight="bold">{LABELS.visitInfo}</Typography>
              </Stack>
            </Box>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.visitDate}</Typography>
                  <Typography fontWeight="500">
                    {visit.visitDate ? dayjs(visit.visitDate).format('DD/MM/YYYY') : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.visitType}</Typography>
                  <Typography fontWeight="500">{VISIT_TYPE_LABELS[visit.visitType] || visit.visitType || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.status}</Typography>
                  <Chip
                    size="small"
                    label={STATUS_LABELS[visit.status] || visit.status || '-'}
                    color={STATUS_COLORS[visit.status] || 'default'}
                    className={`status-${visit.status}`}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">الطبيب</Typography>
                  <Typography fontWeight="500">{visit.doctorName || '-'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Medical Info Section */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon color="primary" />
                <Typography fontWeight="bold">{LABELS.medicalInfo}</Typography>
              </Stack>
            </Box>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography color="textSecondary" variant="body2">{LABELS.diagnosis}</Typography>
                  <Typography fontWeight="500">{visit.diagnosis || '-'}</Typography>
                </Grid>
                {visit.treatment && (
                  <Grid item xs={12}>
                    <Typography color="textSecondary" variant="body2">العلاج</Typography>
                    <Typography fontWeight="500">{visit.treatment}</Typography>
                  </Grid>
                )}
                {visit.notes && (
                  <Grid item xs={12}>
                    <Typography color="textSecondary" variant="body2">ملاحظات</Typography>
                    <Typography fontWeight="500">{visit.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Linked Records */}
          <Card variant="outlined">
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlineIcon color="primary" />
                <Typography fontWeight="bold">{LABELS.linkedRecords}</Typography>
              </Stack>
            </Box>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.claims}</Typography>
                  <Chip
                    size="small"
                    label={`${visit.claimCount || 0} مطالبة`}
                    color={visit.claimCount > 0 ? 'success' : 'default'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">{LABELS.preAuths}</Typography>
                  <Chip
                    size="small"
                    label={`${visit.preAuthCount || 0} موافقة`}
                    color={visit.preAuthCount > 0 ? 'info' : 'default'}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Footer */}
          <Box className="footer" sx={{ textAlign: 'center', mt: 4, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="textSecondary">
              تم إنشاء هذا التقرير بتاريخ: {dayjs().format('DD/MM/YYYY HH:mm')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<CloseIcon />}
        >
          {LABELS.close}
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={handleDownload}
          startIcon={<DownloadIcon />}
        >
          {LABELS.download}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePrint}
          startIcon={<PrintIcon />}
        >
          {LABELS.print}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ========================= MAIN COMPONENT =========================
const ProviderVisitLog = () => {
  const navigate = useNavigate();

  // Data state
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters - Default date to TODAY
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(dayjs()); // TODAY
  const [dateTo, setDateTo] = useState(dayjs());     // TODAY
  const [statusFilter, setStatusFilter] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState('');

  // PDF Preview
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Fetch visits
  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ════════════════════════════════════════════════════════════════════════
      // BUILD PARAMS WITH ALL FILTERS
      // Backend automatically handles provider isolation via ProviderContextGuard
      // ════════════════════════════════════════════════════════════════════════
      const params = {
        page: page,
        size: rowsPerPage,
        // Search by member name/card/civilId
        memberName: searchQuery?.trim() || undefined,
        // Status filter
        status: statusFilter || undefined,
        // Date filters
        fromDate: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
        toDate: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
        // Visit type (optional)
        visitType: visitTypeFilter || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await providerApi.getVisitLog(params);

      setVisits(response.content || response.items || []);
      setTotalCount(response.totalElements || response.totalCount || 0);
    } catch (err) {
      console.error('Error fetching visits:', err);
      setError(LABELS.error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, dateFrom, dateTo, statusFilter, visitTypeFilter]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Handlers
  const handlePageChange = (_, newPage) => setPage(newPage);

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleCreateClaim = (visit) => {
    // Use URL params to preserve data across redirects and page refreshes
    const params = new URLSearchParams({
      fromVisitLog: 'true',
      visitId: visit.visitId,
      memberId: visit.memberId,
      memberName: visit.memberName || '',
      memberCivilId: visit.memberCivilId || '',
      cardNumber: visit.memberCardNumber || '',
      employer: visit.employerName || '',
      phone: visit.memberPhone || '',
      email: visit.memberEmail || '',
      visitDate: visit.visitDate || '',
      visitTime: visit.createdAt?.split('T')[1]?.substring(0, 5) || '',
      visitType: visit.visitType || 'OUTPATIENT',
      providerName: visit.providerName || ''
    });
    navigate(`/provider/claims/submit?${params.toString()}`);
  };

  const handleCreatePreAuth = (visit) => {
    // Use URL params to preserve data across redirects and page refreshes
    const params = new URLSearchParams({
      fromVisitLog: 'true',
      visitId: visit.visitId,
      memberId: visit.memberId,
      memberName: visit.memberName || '',
      memberCivilId: visit.memberCivilId || '',
      cardNumber: visit.memberCardNumber || '',
      employer: visit.employerName || '',
      phone: visit.memberPhone || '',
      email: visit.memberEmail || '',
      visitDate: visit.visitDate || '',
      visitTime: visit.createdAt?.split('T')[1]?.substring(0, 5) || '',
      visitType: visit.visitType || 'OUTPATIENT',
      providerId: visit.providerId || '',
      providerName: visit.providerName || '',
      location: visit.providerLocation || ''
    });
    navigate(`/pre-approvals/add?${params.toString()}`);
  };

  const handlePrintVisit = (visit) => {
    setSelectedVisit(visit);
    setPdfDialogOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFrom(dayjs()); // Reset to TODAY
    setDateTo(dayjs());   // Reset to TODAY
    setStatusFilter('');
    setVisitTypeFilter('');
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ModernPageHeader
        title={LABELS.pageTitle}
        subtitle={LABELS.pageSubtitle}
        icon={LocalHospitalIcon}
        breadcrumbs={[{ label: 'بوابة مقدم الخدمة' }, { label: LABELS.pageTitle }]}
        actions={
          <Stack direction="row" spacing={1}>
            <Tooltip title={showFilters ? LABELS.hideFilters : LABELS.showFilters}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowFilters(!showFilters)}
                startIcon={showFilters ? <FilterAltOffIcon /> : <FilterAltIcon />}
              >
                {showFilters ? LABELS.hideFilters : LABELS.showFilters}
              </Button>
            </Tooltip>
            <Tooltip title={LABELS.refresh}>
              <span>
                <IconButton onClick={fetchVisits} color="primary" disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      <MainCard>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Quick Search Bar */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={LABELS.searchByName}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearchQuery(''); setPage(0); }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper'
              }
            }}
          />
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid xs={12} sm={6} md={3}>
                <DatePicker
                  label={LABELS.dateFrom}
                  value={dateFrom}
                  onChange={setDateFrom}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      InputProps: {
                        startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />
                      }
                    }
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <DatePicker
                  label={LABELS.dateTo}
                  value={dateTo}
                  onChange={setDateTo}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      InputProps: {
                        startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />
                      }
                    }
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{LABELS.status}</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    label={LABELS.status}
                  >
                    <MenuItem value="">{LABELS.allStatuses}</MenuItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{LABELS.visitType}</InputLabel>
                  <Select
                    value={visitTypeFilter}
                    onChange={(e) => { setVisitTypeFilter(e.target.value); setPage(0); }}
                    label={LABELS.visitType}
                  >
                    <MenuItem value="">{LABELS.allTypes}</MenuItem>
                    {Object.entries(VISIT_TYPE_LABELS).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetFilters}
                  startIcon={<FilterAltOffIcon />}
                >
                  إعادة ضبط
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Stats Summary */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip
              icon={<LocalHospitalIcon />}
              label={`إجمالي: ${totalCount} زيارة`}
              variant="outlined"
              color="primary"
            />
            {searchQuery && (
              <Chip
                label={`نتائج البحث: "${searchQuery}"`}
                onDelete={() => setSearchQuery('')}
                color="info"
                size="small"
              />
            )}
            {statusFilter && (
              <Chip
                label={`الحالة: ${STATUS_LABELS[statusFilter]}`}
                onDelete={() => setStatusFilter('')}
                color="warning"
                size="small"
              />
            )}
          </Stack>
        </Box>

        {/* Data Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="medium" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#0066e6' }}> {/* Primary Blue Header */}
                <TableCell sx={{ color: '#fff', fontWeight: 600, py: 2, minWidth: 90 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <BadgeIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span>{LABELS.visitId}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600, py: 2, minWidth: 180 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PersonIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span>{LABELS.memberName}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600, py: 2, minWidth: 120 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CreditCardIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span>{LABELS.civilId}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', minWidth: 110 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CreditCardIcon fontSize="small" color="primary" />
                    <span>{LABELS.cardNumber}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', minWidth: 110 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <EventIcon fontSize="small" color="primary" />
                    <span>{LABELS.visitDate}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', minWidth: 110 }}>
                  {LABELS.visitType}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', minWidth: 100 }}>
                  {LABELS.status}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', minWidth: 130 }}>
                  {LABELS.claimStatus}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', minWidth: 130 }}>
                  {LABELS.preAuthStatus}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', minWidth: 200 }}>
                  {LABELS.actions}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {LABELS.loading}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <LocalHospitalIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                    <Typography variant="body1" color="textSecondary">
                      {LABELS.noData}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((visit) => (
                  <TableRow
                    key={visit.visitId}
                    hover
                    sx={{
                      '&:nth-of-type(odd)': { bgcolor: 'rgba(248, 250, 252, 0.5)' },
                      '&:hover': { bgcolor: 'rgba(224, 242, 254, 0.5) !important' },
                      transition: 'background-color 0.2s',
                      borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
                    }}
                  >
                    {/* Visit ID */}
                    <TableCell>
                      <Chip
                        label={`#${visit.visitId}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
                      />
                    </TableCell>

                    {/* Member Name */}
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {visit.memberName || '-'}
                      </Typography>
                      {visit.employerName && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {visit.employerName}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Civil ID */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {visit.memberCivilId || '-'}
                      </Typography>
                    </TableCell>

                    {/* Card Number */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                        {visit.memberCardNumber || '-'}
                      </Typography>
                    </TableCell>

                    {/* Visit Date */}
                    <TableCell>
                      <Typography variant="body2">
                        {visit.visitDate ? dayjs(visit.visitDate).format('DD/MM/YYYY') : '-'}
                      </Typography>
                    </TableCell>

                    {/* Visit Type */}
                    <TableCell>
                      <Chip
                        label={VISIT_TYPE_LABELS[visit.visitType] || visit.visitTypeLabel || visit.visitType || '-'}
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[visit.status] || visit.statusLabel || visit.status || '-'}
                        size="small"
                        color={STATUS_COLORS[visit.status] || 'default'}
                      />
                    </TableCell>

                    {/* Claim Status - NEW COLUMN */}
                    <TableCell>
                      {visit.claimCount > 0 || visit.latestClaimStatus ? (
                        <Stack spacing={0.5}>
                          <Chip
                            label={CLAIM_STATUS_LABELS[visit.latestClaimStatus] || visit.latestClaimStatusLabel || LABELS.noClaim}
                            size="small"
                            color={CLAIM_STATUS_COLORS[visit.latestClaimStatus] || 'default'}
                            variant="outlined"
                          />
                          {visit.claimCount > 1 && (
                            <Typography variant="caption" color="text.secondary">
                              +{visit.claimCount - 1} أخرى
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {LABELS.noClaim}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Pre-Auth Status - NEW COLUMN */}
                    <TableCell>
                      {visit.preAuthCount > 0 || visit.latestPreAuthStatus ? (
                        <Stack spacing={0.5}>
                          <Chip
                            label={PREAUTH_STATUS_LABELS[visit.latestPreAuthStatus] || visit.latestPreAuthStatusLabel || LABELS.noPreAuth}
                            size="small"
                            color={PREAUTH_STATUS_COLORS[visit.latestPreAuthStatus] || 'default'}
                            variant="outlined"
                          />
                          {visit.preAuthCount > 1 && (
                            <Typography variant="caption" color="text.secondary">
                              +{visit.preAuthCount - 1} أخرى
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {LABELS.noPreAuth}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {/* Create Claim */}
                        {visit.canCreateClaim !== false && (
                          <Tooltip title={LABELS.createClaim}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCreateClaim(visit)}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Create Pre-Auth */}
                        {visit.canCreatePreAuth !== false && (
                          <Tooltip title={LABELS.createPreAuth}>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleCreatePreAuth(visit)}
                            >
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Print/PDF */}
                        <Tooltip title={LABELS.printVisit}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handlePrintVisit(visit)}
                          >
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* View Details */}
                        <Tooltip title={LABELS.viewDetails}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handlePrintVisit(visit)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>

                      {/* Linked counts badges */}
                      {(visit.claimCount > 0 || visit.preAuthCount > 0) && (
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                          {visit.claimCount > 0 && (
                            <Chip
                              size="small"
                              label={`${visit.claimCount} مطالبة`}
                              sx={{ fontSize: '0.65rem', height: 18 }}
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {visit.preAuthCount > 0 && (
                            <Chip
                              size="small"
                              label={`${visit.preAuthCount} موافقة`}
                              sx={{ fontSize: '0.65rem', height: 18 }}
                              color="info"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      )}
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
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage={LABELS.rowsPerPage}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
          sx={{ borderTop: '1px solid #e0e0e0' }}
        />
      </MainCard>

      {/* PDF Preview Dialog */}
      <VisitPdfPreviewDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        visit={selectedVisit}
      />
    </LocalizationProvider>
  );
};

export default ProviderVisitLog;
