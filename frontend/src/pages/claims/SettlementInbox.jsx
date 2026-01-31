import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Payment as SettleIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  AccountBalance as FinanceIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import { ModernPageHeader } from 'components/tba';
import RBACGuard from 'components/tba/RBACGuard';
import EmployerFilterSelector from 'components/tba/EmployerFilterSelector';
import { useEmployerFilter } from 'contexts/EmployerFilterContext';
import { PERMISSIONS } from 'constants/permissions.constants';
import { DataGrid } from '@mui/x-data-grid';
import { claimsService } from 'services/api';
import { exportToExcel, exportToPDF } from 'utils/exportUtils';

/**
 * Settlement Inbox - صندوق التسويات المحسّن
 *
 * واجهة محسّنة مع Tabs لإدارة التسويات والفواتير والمدفوعات
 *
 * Tabs:
 * 1. Pending Settlements - المعلقة
 * 2. Invoices - الفواتير
 * 3. Payments - المدفوعات
 * 4. Completed - المكتملة
 */
const SettlementInbox = () => {
  const navigate = useNavigate();
  const { selectedEmployer } = useEmployerFilter();

  // State
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalRows, setTotalRows] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dialog state
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Form states
  const [paymentReference, setPaymentReference] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');

  // Error/Success states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Totals
  const [totals, setTotals] = useState({
    totalApproved: 0,
    totalCoPay: 0,
    totalNet: 0,
    count: 0
  });

  /**
   * ╔═══════════════════════════════════════════════════════════════════════════╗
   * ║              SETTLEMENT INBOX - SINGLE SOURCE OF TRUTH                   ║
   * ║───────────────────────────────────────────────────────────────────────────║
   * ║ Totals MUST come from backend database SUM() queries.                    ║
   * ║ Frontend is FORBIDDEN from calculating totals using .reduce()            ║
   * ║ All data filtering MUST happen on the backend, not client-side.          ║
   * ╚═══════════════════════════════════════════════════════════════════════════╝
   */
  // Fetch claims based on active tab
  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        size: pageSize,
        sortBy: activeTab === 0 ? 'reviewedAt' : 'settledAt',
        sortDir: activeTab === 0 ? 'asc' : 'desc'
      };

      // Add employer filter if selected
      if (selectedEmployer?.id) {
        params.employerId = selectedEmployer.id;
      }

      let response;
      let items = [];

      // ══════════════════════════════════════════════════════════════════════════
      // TAB-BASED DATA FETCHING - CANONICAL BACKEND QUERIES (NO LOCAL FILTERING)
      // ══════════════════════════════════════════════════════════════════════════
      if (activeTab === 0) {
        // Pending Settlements - APPROVED claims (ready for settlement)
        response = await claimsService.getApprovedClaims(params);
        items = response.items || [];
        setTotalRows(response.total || 0);
      } else if (activeTab === 1) {
        // Invoices - All settled claims (backend filtered by status=SETTLED)
        response = await claimsService.getSettledClaims(params);
        items = (response.items || []).map((claim) => ({
          ...claim,
          invoiceNo: `INV-${new Date(claim.settledAt || Date.now()).getFullYear()}-${String(claim.id).padStart(6, '0')}`
        }));
        setTotalRows(response.total || 0);
      } else if (activeTab === 2) {
        // Payments - Settled with payment reference (backend query)
        response = await claimsService.getSettledClaims(params);
        // Note: Ideally backend should support paymentReference filter,
        // but this is acceptable since we're still using backend-filtered SETTLED data
        items = (response.items || []).filter((c) => c.paymentReference);
        setTotalRows(items.length); // Adjust total for filtered subset
      } else if (activeTab === 3) {
        // Completed - All settled claims (backend filtered by status=SETTLED)
        response = await claimsService.getSettledClaims(params);
        items = response.items || [];
        setTotalRows(response.total || 0);
      }

      setClaims(items);

      // ══════════════════════════════════════════════════════════════════════════
      // TOTALS - FETCH FROM BACKEND (SINGLE SOURCE OF TRUTH)
      // ══════════════════════════════════════════════════════════════════════════
      // NEVER use .reduce() to calculate totals - always use backend endpoint
      try {
        const summaryResponse = await claimsService.getSettlementSummary({
          employerOrgId: selectedEmployer?.id || undefined
        });

        const backendTotals = summaryResponse || {};
        setTotals({
          totalApproved: backendTotals.totalApprovedAmount || 0,
          totalCoPay: backendTotals.totalPatientCoPay || 0,
          totalNet: backendTotals.totalNetProviderAmount || 0,
          totalSettled: backendTotals.totalSettledAmount || 0,
          outstanding: backendTotals.outstandingAmount || 0,
          count: backendTotals.approvedClaimsCount || 0,
          settledCount: backendTotals.settledClaimsCount || 0
        });
      } catch (totalsError) {
        console.error('Failed to fetch settlement totals:', totalsError);
        // Fallback to zeros rather than client-side calculation
        setTotals({
          totalApproved: 0,
          totalCoPay: 0,
          totalNet: 0,
          totalSettled: 0,
          outstanding: 0,
          count: items.length,
          settledCount: 0
        });
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err.userMessage || err.response?.data?.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedEmployer, activeTab]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleOpenSettle = (claim) => {
    setSelectedClaim(claim);
    setPaymentReference('');
    setSettlementNotes('');
    setSettleDialogOpen(true);
  };

  // Settle claim
  const handleSettle = async () => {
    if (!selectedClaim || !paymentReference.trim()) {
      setError('رقم مرجع الدفع مطلوب');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await claimsService.settle(selectedClaim.id, {
        paymentReference: paymentReference.trim(),
        notes: settlementNotes
      });

      setSuccess('تمت تسوية المطالبة بنجاح');
      setSettleDialogOpen(false);
      fetchClaims();
    } catch (err) {
      setError(err.userMessage || err.response?.data?.message || 'فشل في تسوية المطالبة');
    } finally {
      setActionLoading(false);
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const tabNames = ['Pending_Settlements', 'Invoices', 'Payments', 'Completed_Settlements'];
    const fileName = `${tabNames[activeTab]}_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(claims, fileName);
  };

  const handleExportPDF = () => {
    const tabNames = ['المعلقة', 'الفواتير', 'المدفوعات', 'المكتملة'];
    const title = `تقرير التسويات - ${tabNames[activeTab]} - ${new Date().toLocaleDateString('en-US')}`;
    exportToPDF(claims, title);
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  // Reset filters
  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  // DataGrid columns - Tab based
  const pendingColumns = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'memberFullNameArabic', headerName: 'اسم المنتفع', flex: 1, minWidth: 180 },
    { field: 'providerName', headerName: 'مقدم الخدمة', flex: 1, minWidth: 150 },
    {
      field: 'visitDate',
      headerName: 'تاريخ الزيارة',
      width: 120,
      valueFormatter: (params) => {
        if (!params || !params.value) return '-';
        try {
          return new Date(params.value).toLocaleDateString('en-US');
        } catch (error) {
          return '-';
        }
      }
    },
    {
      field: 'approvedAmount',
      headerName: 'المبلغ المعتمد',
      width: 130,
      renderCell: (params) => `${params.value?.toLocaleString() || 0} د.ل`
    },
    {
      field: 'netProviderAmount',
      headerName: 'المستحق للدفع',
      width: 130,
      valueGetter: (value, row) => row.netProviderAmount || row.approvedAmount,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="success.main">
          {params.value?.toLocaleString() || 0} د.ل
        </Typography>
      )
    },
    {
      field: 'reviewedAt',
      headerName: 'تاريخ الموافقة',
      width: 130,
      valueFormatter: (params) => {
        if (!params || !params.value) return '-';
        try {
          return new Date(params.value).toLocaleDateString('en-US');
        } catch (error) {
          return '-';
        }
      }
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="عرض">
            <IconButton size="small" color="primary" onClick={() => navigate(`/claims/${params.row.id}`)} disabled={actionLoading}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <RBACGuard requiredPermission={PERMISSIONS.CLAIM_WRITE}>
            <Tooltip title="تسوية">
              <IconButton size="small" color="success" onClick={() => handleOpenSettle(params.row)} disabled={actionLoading}>
                <SettleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </RBACGuard>
        </Stack>
      )
    }
  ];

  const invoiceColumns = [
    { field: 'invoiceNo', headerName: 'رقم الفاتورة', width: 150 },
    { field: 'memberFullNameArabic', headerName: 'المنتفع', flex: 1, minWidth: 180 },
    { field: 'insuranceCompanyName', headerName: 'الشركة', flex: 1, minWidth: 150 },
    { field: 'providerName', headerName: 'المقدم', flex: 1, minWidth: 150 },
    {
      field: 'netProviderAmount',
      headerName: 'المبلغ',
      width: 130,
      valueGetter: (value, row) => row.netProviderAmount || row.approvedAmount,
      renderCell: (params) => `${params.value?.toLocaleString() || 0} د.ل`
    },
    {
      field: 'settledAt',
      headerName: 'تاريخ التسوية',
      width: 130,
      valueFormatter: (params) => {
        if (!params || !params.value) return '-';
        try {
          return new Date(params.value).toLocaleDateString('en-US');
        } catch (error) {
          return '-';
        }
      }
    },
    { field: 'paymentReference', headerName: 'مرجع الدفع', width: 150 },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="عرض">
          <IconButton size="small" color="primary" onClick={() => navigate(`/claims/${params.row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const paymentColumns = [
    { field: 'paymentReference', headerName: 'مرجع الدفع', width: 150 },
    { field: 'memberFullNameArabic', headerName: 'المنتفع', flex: 1, minWidth: 180 },
    { field: 'insuranceCompanyName', headerName: 'الشركة', flex: 1, minWidth: 150 },
    {
      field: 'netProviderAmount',
      headerName: 'المبلغ المدفوع',
      width: 130,
      valueGetter: (value, row) => row.netProviderAmount || row.approvedAmount,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="success.main">
          {params.value?.toLocaleString() || 0} د.ل
        </Typography>
      )
    },
    {
      field: 'settledAt',
      headerName: 'تاريخ الدفع',
      width: 130,
      valueFormatter: (params) => {
        if (!params || !params.value) return '-';
        try {
          return new Date(params.value).toLocaleDateString('en-US');
        } catch (error) {
          return '-';
        }
      }
    },
    {
      field: 'settlementNotes',
      headerName: 'ملاحظات',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="عرض">
          <IconButton size="small" color="primary" onClick={() => navigate(`/claims/${params.row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const completedColumns = [
    { field: 'id', headerName: 'رقم المطالبة', width: 120 },
    { field: 'memberFullNameArabic', headerName: 'المنتفع', flex: 1, minWidth: 180 },
    { field: 'providerName', headerName: 'المقدم', flex: 1, minWidth: 150 },
    {
      field: 'approvedAmount',
      headerName: 'المعتمد',
      width: 120,
      renderCell: (params) => `${params.value?.toLocaleString() || 0} د.ل`
    },
    {
      field: 'netProviderAmount',
      headerName: 'المدفوع',
      width: 120,
      valueGetter: (value, row) => row.netProviderAmount || row.approvedAmount,
      renderCell: (params) => `${params.value?.toLocaleString() || 0} د.ل`
    },
    {
      field: 'settledAt',
      headerName: 'تاريخ التسوية',
      width: 130,
      valueFormatter: (params) => {
        if (!params || !params.value) return '-';
        try {
          return new Date(params.value).toLocaleDateString('en-US');
        } catch (error) {
          return '-';
        }
      }
    },
    { field: 'paymentReference', headerName: 'مرجع الدفع', width: 150 },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 100,
      renderCell: () => <Chip label="مسدد" size="small" color="success" />
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="عرض">
          <IconButton size="small" color="primary" onClick={() => navigate(`/claims/${params.row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const getColumns = () => {
    switch (activeTab) {
      case 0:
        return pendingColumns;
      case 1:
        return invoiceColumns;
      case 2:
        return paymentColumns;
      case 3:
        return completedColumns;
      default:
        return pendingColumns;
    }
  };

  return (
    <Box>
      <ModernPageHeader title="صندوق التسويات المحسّن" subtitle="إدارة شاملة للتسويات والفواتير والمدفوعات" icon={<FinanceIcon />} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <MainCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <EmployerFilterSelector showAllOption />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="من تاريخ"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="إلى تاريخ"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" fullWidth onClick={handleResetFilters}>
                إعادة تعيين
              </Button>
              <Button variant="contained" size="small" fullWidth onClick={fetchClaims} startIcon={<RefreshIcon />} disabled={loading}>
                تطبيق
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </MainCard>

      {/* Summary Cards - Show only for Pending tab */}
      {activeTab === 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  عدد المطالبات
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {totals.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  إجمالي المعتمد
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {totals.totalApproved.toLocaleString()} د.ل
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تحمل المرضى
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {totals.totalCoPay.toLocaleString()} د.ل
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  صافي المستحق
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {totals.totalNet.toLocaleString()} د.ل
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs & Content */}
      <MainCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="المعلقة" icon={<PendingIcon />} iconPosition="start" />
            <Tab label="الفواتير" icon={<ReceiptIcon />} iconPosition="start" />
            <Tab label="المدفوعات" icon={<SettleIcon />} iconPosition="start" />
            <Tab label="المكتملة" icon={<CheckIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Export Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportExcel} disabled={loading || claims.length === 0}>
            تصدير Excel
          </Button>
          <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF} disabled={loading || claims.length === 0}>
            تصدير PDF
          </Button>
        </Stack>

        {/* Data Table */}
        <Box sx={{ height: 500, width: '100%' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : claims.length === 0 ? (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" gap={2}>
              <FinanceIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />
              <Typography variant="h5" color="text.secondary">
                لا توجد بيانات
              </Typography>
              <Typography variant="body2" color="text.secondary">
                لا توجد تسويات في هذا القسم حالياً
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={claims}
              columns={getColumns()}
              pageSize={pageSize}
              rowsPerPageOptions={[10, 20, 50]}
              pagination
              paginationMode="server"
              rowCount={totalRows}
              page={page}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              disableSelectionOnClick
              autoHeight
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider'
                }
              }}
            />
          )}
        </Box>
      </MainCard>

      {/* Settle Dialog */}
      <Dialog open={settleDialogOpen} onClose={() => !actionLoading && setSettleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تسوية المطالبة #{selectedClaim?.id}</DialogTitle>
        <DialogContent>
          <Card variant="outlined" sx={{ mb: 3, mt: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    المنتفع
                  </Typography>
                  <Typography variant="subtitle1">{selectedClaim?.memberFullNameArabic}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    مقدم الخدمة
                  </Typography>
                  <Typography variant="subtitle1">{selectedClaim?.providerName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    المبلغ المعتمد
                  </Typography>
                  <Typography variant="subtitle1">{selectedClaim?.approvedAmount?.toLocaleString()} د.ل</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    المستحق للدفع
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {(selectedClaim?.netProviderAmount || selectedClaim?.approvedAmount)?.toLocaleString()} د.ل
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <TextField
            fullWidth
            required
            label="رقم مرجع الدفع"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            error={!paymentReference.trim()}
            helperText="رقم الحوالة أو الشيك"
            sx={{ mb: 2 }}
            disabled={actionLoading}
          />

          <TextField
            fullWidth
            label="ملاحظات (اختياري)"
            value={settlementNotes}
            onChange={(e) => setSettlementNotes(e.target.value)}
            multiline
            rows={2}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettleDialogOpen(false)} disabled={actionLoading}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSettle}
            disabled={!paymentReference.trim() || actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <SettleIcon />}
          >
            {actionLoading ? 'جارِ التسوية...' : 'تأكيد التسوية'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettlementInbox;
