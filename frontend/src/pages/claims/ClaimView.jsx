import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Receipt as ReceiptIcon,
  MedicalServices as MedicalIcon,
  AttachFile as AttachmentIcon,
  Send as SendIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Replay as ReturnIcon,
  PlayArrow as StartReviewIcon,
  Payment as SettleIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MainCard from 'components/MainCard';
import { ModernPageHeader } from 'components/tba';
import { useClaimDetails } from 'hooks/useClaims';
import { FileUploader, AttachmentList } from 'components/upload';
import { uploadClaimAttachment, getClaimAttachments, downloadClaimAttachment, deleteClaimAttachment } from 'services/api/files.service';
import { claimsService } from 'services/api';

// Insurance UX Components - Phase B2 Step 2
import { StatusTimeline, AmountComparisonBar, CardStatusBadge, NetworkBadge, getWorkflowSteps } from 'components/insurance';

// Claim Status Mapping for CardStatusBadge
const CLAIM_STATUS_MAP = {
  PENDING_REVIEW: 'PENDING',
  PREAPPROVED: 'ACTIVE',
  APPROVED: 'ACTIVE',
  PARTIALLY_APPROVED: 'ACTIVE',
  REJECTED: 'BLOCKED',
  RETURNED_FOR_INFO: 'SUSPENDED',
  CANCELLED: 'INACTIVE',
  SETTLED: 'ACTIVE'
};

const CLAIM_ATTACHMENT_TYPES = [
  { value: 'INVOICE', label: 'فاتورة' },
  { value: 'MEDICAL_REPORT', label: 'تقرير طبي' },
  { value: 'PRESCRIPTION', label: 'وصفة طبية' },
  { value: 'LAB_RESULT', label: 'نتيجة مختبر' },
  { value: 'XRAY', label: 'أشعة' },
  { value: 'OTHER', label: 'أخرى' }
];

const InfoRow = ({ label, value, valueColor }) => (
  <Grid container spacing={2} sx={{ mb: 1.5 }}>
    <Grid item xs={4}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
    </Grid>
    <Grid item xs={8}>
      <Typography variant="body1" color={valueColor || 'text.primary'}>
        {value ?? '-'}
      </Typography>
    </Grid>
  </Grid>
);

const ClaimView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { claim, loading, refresh } = useClaimDetails(id);
  const { enqueueSnackbar } = useSnackbar();
  
  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  
  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');

  // Fetch attachments when claim is loaded
  useEffect(() => {
    if (claim?.id) {
      fetchAttachments();
    }
  }, [claim?.id]);

  const fetchAttachments = async () => {
    if (!claim?.id) return;
    
    try {
      setLoadingAttachments(true);
      const data = await getClaimAttachments(claim.id);
      setAttachments(data || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Submit claim for review (DRAFT → SUBMITTED)
  const handleSubmitClaim = useCallback(async () => {
    if (!claim?.id) return;
    
    setActionLoading(true);
    try {
      await claimsService.submit(claim.id);
      enqueueSnackbar('تم إرسال المطالبة للمراجعة بنجاح', { variant: 'success' });
      if (refresh) refresh();
    } catch (error) {
      console.error('Failed to submit claim:', error);
      const errorMessage = error.response?.data?.message || 'فشل في إرسال المطالبة';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [claim?.id, enqueueSnackbar, refresh]);

  // Start review (SUBMITTED → UNDER_REVIEW)
  const handleStartReview = useCallback(async () => {
    if (!claim?.id) return;
    
    setActionLoading(true);
    try {
      await claimsService.startReview(claim.id);
      enqueueSnackbar('تم استلام المطالبة للمراجعة', { variant: 'success' });
      if (refresh) refresh();
    } catch (error) {
      console.error('Failed to start review:', error);
      const errorMessage = error.response?.data?.message || 'فشل في بدء المراجعة';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [claim?.id, enqueueSnackbar, refresh]);

  // Approve claim - Open dialog
  const handleApprove = useCallback(() => {
    if (!claim?.id) return;
    // Pre-fill approved amount with requested amount
    setApprovedAmount(claim?.requestedAmount?.toString() || '');
    setApprovalNotes('');
    setApproveDialogOpen(true);
  }, [claim?.id, claim?.requestedAmount]);

  // Confirm approval
  const handleApproveConfirm = useCallback(async () => {
    if (!claim?.id || !approvedAmount) return;
    
    const amount = parseFloat(approvedAmount);
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('المبلغ المعتمد يجب أن يكون رقم موجب', { variant: 'error' });
      return;
    }
    
    setActionLoading(true);
    try {
      await claimsService.approve(claim.id, { 
        approvedAmount: amount,
        notes: approvalNotes || undefined 
      });
      enqueueSnackbar('تمت الموافقة على المطالبة بنجاح', { variant: 'success' });
      setApproveDialogOpen(false);
      setApprovedAmount('');
      setApprovalNotes('');
      if (refresh) refresh();
    } catch (error) {
      console.error('Failed to approve claim:', error);
      const errorMessage = error.response?.data?.message || 'فشل في الموافقة على المطالبة';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [claim?.id, approvedAmount, approvalNotes, enqueueSnackbar, refresh]);

  // Reject claim with reason
  const handleRejectConfirm = useCallback(async () => {
    if (!claim?.id || !rejectReason.trim()) return;
    
    setActionLoading(true);
    try {
      await claimsService.reject(claim.id, { rejectionReason: rejectReason });
      enqueueSnackbar('تم رفض المطالبة', { variant: 'success' });
      setRejectDialogOpen(false);
      setRejectReason('');
      if (refresh) refresh();
    } catch (error) {
      console.error('Failed to reject claim:', error);
      const errorMessage = error.response?.data?.message || 'فشل في رفض المطالبة';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [claim?.id, rejectReason, enqueueSnackbar, refresh]);

  // Return for info with reason
  const handleReturnForInfoConfirm = useCallback(async () => {
    if (!claim?.id || !returnReason.trim()) return;
    
    setActionLoading(true);
    try {
      await claimsService.returnForInfo(claim.id, { 
        reason: returnReason,
        requiredDocuments: requiredDocuments || undefined 
      });
      enqueueSnackbar('تم إعادة المطالبة لطلب معلومات إضافية', { variant: 'success' });
      setReturnDialogOpen(false);
      setReturnReason('');
      setRequiredDocuments('');
      if (refresh) refresh();
    } catch (error) {
      console.error('Failed to return claim for info:', error);
      const errorMessage = error.response?.data?.message || 'فشل في إعادة المطالبة';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [claim?.id, returnReason, requiredDocuments, enqueueSnackbar, refresh]);

  // Settle claim - Open dialog
  const handleSettle = useCallback(() => {
    if (!claim?.id) return;
    setPaymentReference('');
    setSettlementNotes('');
    setSettleDialogOpen(true);
  }, [claim?.id]);

  // Confirm settlement
  const handleSettleConfirm = useCallback(async () => {
    if (!claim?.id || !paymentReference.trim()) return;
    
    setActionLoading(true);
    try {
      await claimsService.settle(claim.id, { 
        paymentReference: paymentReference.trim(),
        notes: settlementNotes || undefined 
      });
      enqueueSnackbar('تمت تسوية المطالبة بنجاح', { variant: 'success' });
      setSettleDialogOpen(false);
      setPaymentReference('');
      setSettlementNotes('');
      if (refresh) refresh();
    } catch (error) {
      console.error('Failed to settle claim:', error);
      const errorMessage = error.response?.data?.message || 'فشل في تسوية المطالبة';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [claim?.id, paymentReference, settlementNotes, enqueueSnackbar, refresh]);

  // Helper to check if action is allowed based on Backend response
  const isActionAllowed = (targetStatus) => {
    return claim?.allowedNextStatuses?.includes(targetStatus);
  };

  const handleUploadSuccess = () => {
    fetchAttachments();
  };

  const handleDownload = async (attachmentId) => {
    return await downloadClaimAttachment(claim.id, attachmentId);
  };

  const handleDelete = async (attachmentId) => {
    try {
      await deleteClaimAttachment(claim.id, attachmentId);
      await fetchAttachments();
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  if (loading) {
    return (
      <MainCard title="تفاصيل المطالبة">
        <Typography>جاري التحميل...</Typography>
      </MainCard>
    );
  }

  if (!claim) {
    return (
      <MainCard title="تفاصيل المطالبة">
        <Typography>المطالبة غير موجودة</Typography>
      </MainCard>
    );
  }

  // Get workflow steps for timeline
  const timelineSteps = getWorkflowSteps('claim', claim?.status, 'ar');

  return (
    <>
      <ModernPageHeader
        title={`مطالبة ${claim?.claimNumber ?? `#${claim?.id}` ?? '-'}`}
        subtitle={claim?.memberName ?? claim?.memberFullName ?? '-'}
        icon={ReceiptIcon}
        breadcrumbs={[{ label: 'الرئيسية', href: '/' }, { label: 'المطالبات', href: '/claims' }, { label: `مطالبة ${claim?.claimNumber ?? `#${claim?.id}` ?? '-'}` }]}
        actions={
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <CardStatusBadge
              status={CLAIM_STATUS_MAP[claim?.status] ?? 'PENDING'}
              customLabel={claim?.statusLabel}
              size="medium"
              variant="detailed"
            />
            
            {/* Backend-Driven Actions - Based on allowedNextStatuses */}
            
            {/* Submit Button - DRAFT → SUBMITTED */}
            {isActionAllowed('SUBMITTED') && (
              <Button 
                variant="contained" 
                color="primary"
                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                onClick={handleSubmitClaim}
                disabled={actionLoading}
              >
                إرسال للمراجعة
              </Button>
            )}
            
            {/* Start Review - SUBMITTED → UNDER_REVIEW */}
            {isActionAllowed('UNDER_REVIEW') && (
              <Button 
                variant="contained" 
                color="info"
                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <StartReviewIcon />}
                onClick={handleStartReview}
                disabled={actionLoading}
              >
                استلام للمراجعة
              </Button>
            )}
            
            {/* Approve - UNDER_REVIEW → APPROVED */}
            {isActionAllowed('APPROVED') && (
              <Button 
                variant="contained" 
                color="success"
                startIcon={<ApproveIcon />}
                onClick={handleApprove}
                disabled={actionLoading}
              >
                موافقة
              </Button>
            )}
            
            {/* Reject - UNDER_REVIEW → REJECTED */}
            {isActionAllowed('REJECTED') && (
              <Button 
                variant="contained" 
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => setRejectDialogOpen(true)}
                disabled={actionLoading}
              >
                رفض
              </Button>
            )}
            
            {/* Return for Info - UNDER_REVIEW → RETURNED_FOR_INFO */}
            {isActionAllowed('RETURNED_FOR_INFO') && (
              <Button 
                variant="outlined" 
                color="warning"
                startIcon={<ReturnIcon />}
                onClick={() => setReturnDialogOpen(true)}
                disabled={actionLoading}
              >
                طلب معلومات إضافية
              </Button>
            )}
            
            {/* Settle - APPROVED → SETTLED */}
            {isActionAllowed('SETTLED') && (
              <Button 
                variant="contained" 
                color="success"
                startIcon={<SettleIcon />}
                onClick={handleSettle}
                disabled={actionLoading}
              >
                تسوية
              </Button>
            )}
            
            {/* Edit - Only if canEdit is true from Backend */}
            {claim?.canEdit && (
              <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/claims/edit/${id}`)}>
                تعديل
              </Button>
            )}
            
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/claims')}>
              عودة
            </Button>
          </Stack>
        }
      />
      <MainCard>
        <Stack spacing={3}>
          {/* ===================== CLAIM TIMELINE ===================== */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                مسار المطالبة
              </Typography>
              {/* Insurance UX - StatusTimeline */}
              <StatusTimeline
                steps={timelineSteps}
                currentStep={claim?.status}
                variant="horizontal"
                size="medium"
                showDates={true}
                language="ar"
              />
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* ===================== BASIC INFORMATION ===================== */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    المعلومات الأساسية
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <InfoRow label="رقم المطالبة" value={claim?.claimNumber || `CLM-${claim?.id}`} />
                  <InfoRow label="المؤمَّن عليه" value={claim?.memberName ?? claim?.memberFullName} />
                  <InfoRow label="الرقم الوطني" value={claim?.memberNationalNumber} />
                  <InfoRow label="جهة العمل" value={claim?.employerName ?? '-'} />

                  {/* PreAuthorization Link */}
                  {claim?.preApprovalId && (
                    <Grid container spacing={2} sx={{ mb: 1.5 }}>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          الموافقة المسبقة
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={claim?.preApprovalReferenceNumber || `PA-${claim.preApprovalId}`}
                            color="success"
                            size="small"
                            icon={<MedicalIcon />}
                            onClick={() => navigate(`/pre-approvals/${claim.preApprovalId}`)}
                            sx={{ cursor: 'pointer' }}
                          />
                          {claim?.preApprovalStatus && (
                            <Typography variant="caption" color="success.main">
                              ({claim.preApprovalStatus})
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  )}

                  {/* NOTE: InsuranceCompany/Policy/Package fields REMOVED - Use BenefitPolicy via member only */}
                </CardContent>
              </Card>
            </Grid>

            {/* ===================== MEDICAL INFORMATION ===================== */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <MedicalIcon color="primary" fontSize="small" />
                    <Typography variant="h6">المعلومات الطبية</Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />

                  {/* Provider with NetworkBadge */}
                  <Grid container spacing={2} sx={{ mb: 1.5 }}>
                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        مقدم الخدمة
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body1">{claim?.providerName ?? '-'}</Typography>
                        {/* Insurance UX - NetworkBadge */}
                        <NetworkBadge networkTier={claim?.networkTier ?? 'IN_NETWORK'} size="small" variant="chip" language="ar" />
                      </Stack>
                    </Grid>
                  </Grid>

                  <InfoRow label="الطبيب" value={claim?.doctorName} />
                  <InfoRow label="التشخيص" value={claim?.diagnosis} />
                  <InfoRow label="تاريخ الزيارة" value={claim?.visitDate ? new Date(claim.visitDate).toLocaleDateString('en-US') : '-'} />
                </CardContent>
              </Card>
            </Grid>

            {/* ===================== FINANCIAL BREAKDOWN ===================== */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    الملخص المالي
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  {/* Insurance UX - AmountComparisonBar */}
                  <AmountComparisonBar
                    requestedAmount={typeof claim?.requestedAmount === 'number' ? claim.requestedAmount : 0}
                    approvedAmount={
                      // If claim is not yet decided (APPROVED/REJECTED/SETTLED), show full amount as potentially approved
                      // This prevents showing "Rejected Amount" before a decision is made
                      ['APPROVED', 'SETTLED', 'REJECTED'].includes(claim?.status)
                        ? (typeof claim?.approvedAmount === 'number' ? claim.approvedAmount : 0)
                        : (typeof claim?.requestedAmount === 'number' ? claim.requestedAmount : 0)
                    }
                    currency="LYD"
                    copayPercentage={typeof claim?.copayPercentage === 'number' ? claim.copayPercentage : 0}
                    deductible={typeof claim?.deductible === 'number' ? claim.deductible : 0}
                    showBreakdown={true}
                    size="medium"
                    language="ar"
                    status={claim?.status}
                  />

                  {/* Reviewer Comment */}
                  {claim?.reviewerComment && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        تعليق المراجع
                      </Typography>
                      <Typography variant="body2">{claim.reviewerComment}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* ===================== SERVICE LINES ===================== */}
            {Array.isArray(claim?.lines) && claim.lines.length > 0 && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <MedicalIcon color="primary" fontSize="small" />
                      <Typography variant="h6">الخدمات الطبية ({claim.lines.length})</Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              كود الخدمة
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              الوصف
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              الكمية
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              سعر الوحدة
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              المجموع
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {claim.lines.map((line, index) => (
                            <TableRow key={line?.id ?? index} hover>
                              <TableCell align="right">
                                <Chip label={line?.serviceCode ?? '-'} size="small" variant="outlined" color="primary" />
                              </TableCell>
                              <TableCell align="right">{line?.description ?? '-'}</TableCell>
                              <TableCell align="center">{line?.quantity ?? 1}</TableCell>
                              <TableCell align="right">
                                {typeof line?.unitPrice === 'number'
                                  ? line.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
                                  : '-'}
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontWeight={500}>
                                  {typeof line?.totalPrice === 'number'
                                    ? line.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
                                    : '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* ===================== ATTACHMENTS ===================== */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AttachmentIcon color="primary" fontSize="small" />
                    <Typography variant="h6">المرفقات ({attachments.length})</Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />

                  {/* File Uploader */}
                  <Box sx={{ mb: 3 }}>
                    <FileUploader
                      uploadFn={async (file, attachmentType) => {
                        return await uploadClaimAttachment(claim.id, file, attachmentType);
                      }}
                      attachmentTypes={CLAIM_ATTACHMENT_TYPES}
                      onUploadSuccess={handleUploadSuccess}
                      maxSize={10 * 1024 * 1024} // 10MB
                      accept="application/pdf,image/jpeg,image/png"
                      label="رفع مرفق جديد"
                    />
                  </Box>

                  {/* Attachments List */}
                  <AttachmentList
                    attachments={attachments}
                    loading={loadingAttachments}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    canDelete={true}
                    emptyMessage="لا توجد مرفقات لهذه المطالبة"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </MainCard>

      {/* ===================== REJECT DIALOG ===================== */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          رفض المطالبة
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            يرجى إدخال سبب رفض المطالبة. هذا الحقل إلزامي.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="سبب الرفض"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            error={rejectReason.length > 0 && rejectReason.length < 10}
            helperText={rejectReason.length > 0 && rejectReason.length < 10 ? 'السبب يجب أن يكون 10 أحرف على الأقل' : ''}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error" 
            variant="contained"
            disabled={actionLoading || rejectReason.length < 10}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <RejectIcon />}
          >
            تأكيد الرفض
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== RETURN FOR INFO DIALOG ===================== */}
      <Dialog 
        open={returnDialogOpen} 
        onClose={() => setReturnDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          طلب معلومات إضافية
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            يرجى توضيح المعلومات الإضافية المطلوبة من صاحب المطالبة.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="سبب طلب المعلومات"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            error={returnReason.length > 0 && returnReason.length < 10}
            helperText={returnReason.length > 0 && returnReason.length < 10 ? 'السبب يجب أن يكون 10 أحرف على الأقل' : ''}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="المستندات المطلوبة (اختياري)"
            value={requiredDocuments}
            onChange={(e) => setRequiredDocuments(e.target.value)}
            placeholder="مثال: صورة من الهوية، تقرير طبي مفصل..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={handleReturnForInfoConfirm} 
            color="warning" 
            variant="contained"
            disabled={actionLoading || returnReason.length < 10}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <ReturnIcon />}
          >
            تأكيد الإرسال
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== APPROVE DIALOG ===================== */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          الموافقة على المطالبة
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            المبلغ المطلوب: <strong>{claim?.requestedAmount?.toLocaleString()} د.ل</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="المبلغ المعتمد (د.ل)"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
            error={approvedAmount && (isNaN(parseFloat(approvedAmount)) || parseFloat(approvedAmount) <= 0)}
            helperText={approvedAmount && parseFloat(approvedAmount) <= 0 ? 'المبلغ يجب أن يكون أكبر من صفر' : ''}
            required
            sx={{ mb: 2 }}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="ملاحظات (اختياري)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="أي ملاحظات حول الموافقة..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={handleApproveConfirm} 
            color="success" 
            variant="contained"
            disabled={actionLoading || !approvedAmount || parseFloat(approvedAmount) <= 0}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <ApproveIcon />}
          >
            تأكيد الموافقة
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== SETTLE DIALOG ===================== */}
      <Dialog 
        open={settleDialogOpen} 
        onClose={() => setSettleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.dark', color: 'white' }}>
          تسوية المطالبة
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            المبلغ المعتمد: <strong>{claim?.approvedAmount?.toLocaleString()} د.ل</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="رقم مرجع الدفع"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            error={paymentReference.length > 0 && paymentReference.trim().length < 3}
            helperText={paymentReference.length > 0 && paymentReference.trim().length < 3 ? 'رقم المرجع يجب أن يكون 3 أحرف على الأقل' : ''}
            required
            sx={{ mb: 2 }}
            placeholder="مثال: TRN-2026-001234"
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="ملاحظات التسوية (اختياري)"
            value={settlementNotes}
            onChange={(e) => setSettlementNotes(e.target.value)}
            placeholder="أي ملاحظات حول التسوية..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettleDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={handleSettleConfirm} 
            color="success" 
            variant="contained"
            disabled={actionLoading || !paymentReference.trim() || paymentReference.trim().length < 3}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <SettleIcon />}
          >
            تأكيد التسوية
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClaimView;
