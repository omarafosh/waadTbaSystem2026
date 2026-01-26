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
  Divider,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Assessment as ReportIcon,
  PlayArrow as StartReviewIcon
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import { ModernPageHeader } from 'components/tba';
import RBACGuard from 'components/tba/RBACGuard';
import EmployerFilterSelector from 'components/tba/EmployerFilterSelector';
import { useEmployerFilter } from 'contexts/EmployerFilterContext';
import { PERMISSIONS } from 'constants/permissions.constants';
import { DataGrid } from '@mui/x-data-grid';
import { claimsService } from 'services/api';

/**
 * Claims Inbox - صندوق عمل موظف المطالبات
 *
 * يعرض المطالبات المعلقة (SUBMITTED | UNDER_REVIEW)
 * مع إمكانية الموافقة أو الرفض
 *
 * Workflow: SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
 */
const ClaimsInbox = () => {
  const navigate = useNavigate();
  const { selectedEmployer } = useEmployerFilter();

  // State
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalRows, setTotalRows] = useState(0);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);

  // Form states
  const [approvedAmount, setApprovedAmount] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [useSystemCalculation, setUseSystemCalculation] = useState(true);

  // Error/Success states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch pending claims
  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir: 'asc'
      };
      // Add employer filter if selected
      if (selectedEmployer?.id) {
        params.employerId = selectedEmployer.id;
      }
      const response = await claimsService.getPendingClaims(params);
      setClaims(response.items || []);
      setTotalRows(response.total || 0);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err.userMessage || err.response?.data?.message || 'فشل في تحميل المطالبات');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedEmployer]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Start Review - SUBMITTED → UNDER_REVIEW
  const handleStartReview = async (claim) => {
    if (claim.status !== 'SUBMITTED') {
      setError('يمكن بدء المراجعة فقط للمطالبات المقدمة');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await claimsService.startReview(claim.id);
      setSuccess('تم استلام المطالبة للمراجعة');
      fetchClaims();
    } catch (err) {
      setError(err.userMessage || err.response?.data?.message || 'فشل في بدء المراجعة');
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch cost breakdown when opening approve dialog
  const handleOpenApprove = async (claim) => {
    // Must be UNDER_REVIEW to approve
    if (claim.status !== 'UNDER_REVIEW') {
      setError('يجب بدء المراجعة أولاً قبل الموافقة');
      return;
    }

    setSelectedClaim(claim);
    setApprovedAmount(claim.requestedAmount?.toString() || '');
    setApprovalNotes('');
    setUseSystemCalculation(true);

    try {
      const breakdown = await claimsService.getCostBreakdown(claim.id);
      setCostBreakdown(breakdown);
      // Pre-fill with system-calculated amount
      if (breakdown?.netProviderAmount) {
        setApprovedAmount(breakdown.netProviderAmount.toString());
      }
    } catch (err) {
      console.error('Error fetching cost breakdown:', err);
    }

    setApproveDialogOpen(true);
  };

  const handleOpenReject = (claim) => {
    // Must be UNDER_REVIEW to reject
    if (claim.status !== 'UNDER_REVIEW') {
      setError('يجب بدء المراجعة أولاً قبل الرفض');
      return;
    }
    setSelectedClaim(claim);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  // Approve claim
  const handleApprove = async () => {
    if (!selectedClaim) return;

    try {
      setActionLoading(true);
      setError(null);
      await claimsService.approve(selectedClaim.id, {
        approvedAmount: useSystemCalculation ? null : parseFloat(approvedAmount),
        notes: approvalNotes,
        useSystemCalculation
      });

      setSuccess('تمت الموافقة على المطالبة بنجاح');
      setApproveDialogOpen(false);
      fetchClaims();
    } catch (err) {
      setError(err.userMessage || err.response?.data?.message || 'فشل في الموافقة على المطالبة');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject claim
  const handleReject = async () => {
    if (!selectedClaim || !rejectionReason.trim()) {
      setError('سبب الرفض مطلوب');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await claimsService.reject(selectedClaim.id, {
        rejectionReason: rejectionReason.trim()
      });

      setSuccess('تم رفض المطالبة');
      setRejectDialogOpen(false);
      fetchClaims();
    } catch (err) {
      setError(err.userMessage || err.response?.data?.message || 'فشل في رفض المطالبة');
    } finally {
      setActionLoading(false);
    }
  };

  // Status chip renderer
  const renderStatus = (status) => {
    const statusColors = {
      SUBMITTED: 'warning',
      UNDER_REVIEW: 'info',
      APPROVED: 'success',
      REJECTED: 'error',
      SETTLED: 'default'
    };

    const statusLabels = {
      SUBMITTED: 'مقدم',
      UNDER_REVIEW: 'قيد المراجعة',
      APPROVED: 'موافق عليه',
      REJECTED: 'مرفوض',
      SETTLED: 'تم التسوية'
    };

    return <Chip label={statusLabels[status] || status} color={statusColors[status] || 'default'} size="small" />;
  };

  // DataGrid columns
  const columns = [
    {
      field: 'id',
      headerName: '#',
      width: 70,
      valueGetter: (value, row) => row?.claimNumber || `CLM-${row?.id}` || row?.id
    },
    {
      field: 'memberName',
      headerName: 'اسم المؤمن عليه',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row?.memberName || row?.memberFullName || '-'
    },
    {
      field: 'memberNationalNumber',
      headerName: 'الرقم الوطني',
      width: 130,
      valueGetter: (value, row) => row?.memberNationalNumber || '-'
    },
    {
      field: 'providerName',
      headerName: 'مقدم الخدمة',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row?.providerName || '-'
    },
    {
      field: 'serviceDate',
      headerName: 'تاريخ الخدمة',
      width: 120,
      valueGetter: (value, row) => {
        const date = row?.serviceDate || row?.visitDate;
        return date ? new Date(date).toLocaleDateString('en-US') : '-';
      }
    },
    {
      field: 'requestedAmount',
      headerName: 'المبلغ المطلوب',
      width: 130,
      valueGetter: (value, row) => {
        const amount = row?.totalAmount || row?.requestedAmount;
        return amount ? `${Number(amount).toFixed(2)} د.ل` : '-';
      }
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 130,
      renderCell: (params) => renderStatus(params.value)
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 220,
      sortable: false,
      renderCell: (params) => {
        const isSubmitted = params.row.status === 'SUBMITTED';
        const isUnderReview = params.row.status === 'UNDER_REVIEW';

        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="عرض التفاصيل">
              <IconButton size="small" color="primary" onClick={() => navigate(`/claims/${params.row.id}`)} disabled={actionLoading}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Start Review - only for SUBMITTED claims */}
            {isSubmitted && (
              <Tooltip title="بدء المراجعة">
                <IconButton size="small" color="info" onClick={() => handleStartReview(params.row)} disabled={actionLoading}>
                  <StartReviewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Approve - only for UNDER_REVIEW claims */}
            <Tooltip title={isUnderReview ? 'موافقة' : 'يجب بدء المراجعة أولاً'}>
              <span>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleOpenApprove(params.row)}
                  disabled={actionLoading || !isUnderReview}
                >
                  <ApproveIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {/* Reject - only for UNDER_REVIEW claims */}
            <Tooltip title={isUnderReview ? 'رفض' : 'يجب بدء المراجعة أولاً'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleOpenReject(params.row)}
                  disabled={actionLoading || !isUnderReview}
                >
                  <RejectIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      }
    }
  ];

  return (
    <>
      <ModernPageHeader
        title="صندوق المطالبات"
        subtitle="المطالبات المعلقة في انتظار المراجعة والموافقة"
        icon={ReportIcon}
        actions={
          <Button startIcon={<RefreshIcon />} onClick={fetchClaims} disabled={loading}>
            تحديث
          </Button>
        }
      />

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

      {/* Employer Filter */}
      <Box sx={{ mb: 2 }}>
        <EmployerFilterSelector />
      </Box>

      <MainCard>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={claims}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={totalRows}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            rowsPerPageOptions={[10, 20, 50]}
            disableSelectionOnClick
            localeText={{
              noRowsLabel: 'لا توجد مطالبات معلقة',
              MuiTablePagination: {
                labelRowsPerPage: 'عدد الصفوف:'
              }
            }}
          />
        </Box>
      </MainCard>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>موافقة على المطالبة #{selectedClaim?.id}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Cost Breakdown */}
            {costBreakdown && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      تفصيل التكلفة (Financial Snapshot)
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                          المطلوب
                        </Typography>
                        <Typography variant="h6">{costBreakdown.requestedAmount?.toFixed(2)} د.ل</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                          تحمل المريض
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {costBreakdown.patientCoPay?.toFixed(2)} د.ل
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ({costBreakdown.coPayPercent}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                          المستحق للمستشفى
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {costBreakdown.netProviderAmount?.toFixed(2)} د.ل
                        </Typography>
                      </Grid>
                    </Grid>
                    {costBreakdown.calculationsValid && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        ✓ الحسابات صحيحة: المطلوب = تحمل المريض + المستحق للمستشفى
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="المبلغ المعتمد"
                value={approvedAmount}
                onChange={(e) => {
                  setApprovedAmount(e.target.value);
                  setUseSystemCalculation(false);
                }}
                type="number"
                helperText={useSystemCalculation ? 'سيتم استخدام الحساب التلقائي' : 'مبلغ يدوي'}
                disabled={actionLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات (اختياري)"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                multiline
                rows={3}
                disabled={actionLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <ApproveIcon />}
          >
            {actionLoading ? 'جار الموافقة...' : 'موافقة'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => !actionLoading && setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>رفض المطالبة #{selectedClaim?.id}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            required
            label="سبب الرفض (إلزامي)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={4}
            error={!rejectionReason.trim()}
            helperText="يرجى تحديد سبب الرفض بوضوح"
            sx={{ mt: 2 }}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectionReason.trim() || actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <RejectIcon />}
          >
            {actionLoading ? 'جار الرفض...' : 'رفض'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClaimsInbox;
