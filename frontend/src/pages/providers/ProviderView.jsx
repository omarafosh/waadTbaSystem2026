import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Phone,
  Email,
  LocationOn,
  Business,
  Badge,
  VerifiedUser,
  LocalHospital as ProviderIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { openSnackbar } from 'api/snackbar';
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { useProviderDetails } from 'hooks/useProviders';
import { providersService } from 'services/api';

// Insurance UX Components - Phase B2 Step 6
import { NetworkBadge, CardStatusBadge } from 'components/insurance';

// ============ PROVIDER CONFIGURATION ============
const PROVIDER_TYPE_LABELS = {
  HOSPITAL: 'مستشفى',
  CLINIC: 'عيادة',
  LAB: 'مختبر',
  LABORATORY: 'مختبر',
  PHARMACY: 'صيدلية',
  RADIOLOGY: 'مركز أشعة'
};

const PROVIDER_TYPE_COLORS = {
  HOSPITAL: 'error',
  CLINIC: 'primary',
  LAB: 'warning',
  LABORATORY: 'warning',
  PHARMACY: 'success',
  RADIOLOGY: 'info'
};

// Status Labels (Arabic)
const STATUS_LABELS_AR = {
  ACTIVE: 'نشط',
  INACTIVE: 'غير نشط',
  SUSPENDED: 'موقوف',
  EXPIRED: 'منتهي'
};

// Network Status mapping
const getNetworkTier = (provider) => {
  if (provider?.networkStatus) return provider.networkStatus;
  if (provider?.inNetwork === true) return 'IN_NETWORK';
  if (provider?.inNetwork === false) return 'OUT_OF_NETWORK';
  if (provider?.contracted === true) return 'IN_NETWORK';
  if (provider?.contracted === false) return 'OUT_OF_NETWORK';
  return null;
};

// Get provider status
const getProviderStatus = (provider) => {
  if (provider?.status) return provider.status;
  if (provider?.active === true) return 'ACTIVE';
  if (provider?.active === false) return 'INACTIVE';
  return 'ACTIVE';
};

const ProviderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { provider, loading } = useProviderDetails(id);

  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [contractForm, setContractForm] = useState({
    contractNumber: '',
    startDate: '',
    endDate: '',
    discountRate: 0,
    autoRenew: false,
    insuranceOrganizationId: 1 // Default to GIG for now
  });

  const fetchContracts = async () => {
    if (id) {
      setLoadingContracts(true);
      try {
        const data = await providersService.getContracts(id);
        setContracts(data || []);
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
        setContracts([]);
      } finally {
        setLoadingContracts(false);
      }
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [id]);

  const handleOpenContractDialog = () => {
    setContractForm({
      contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      discountRate: 0,
      autoRenew: true,
      insuranceOrganizationId: 1
    });
    setOpenContractDialog(true);
  };

  const handleSaveContract = async () => {
    try {
      await providersService.createContract(id, contractForm);
      openSnackbar({
        open: true,
        message: 'تم إضافة العقد بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });
      setOpenContractDialog(false);
      fetchContracts();
    } catch (error) {
      openSnackbar({
        open: true,
        message: 'فشل إضافة العقد',
        variant: 'alert',
        alert: { color: 'error' }
      });
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العقد؟')) return;
    try {
      await providersService.deleteContract(id, contractId);
      openSnackbar({
        open: true,
        message: 'تم حذف العقد بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });
      fetchContracts();
    } catch (error) {
      openSnackbar({
        open: true,
        message: 'فشل حذف العقد',
        variant: 'alert',
        alert: { color: 'error' }
      });
    }
  };

  if (loading) {
    return (
      <MainCard>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (!provider) {
    return (
      <MainCard>
        <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
          <Business sx={{ fontSize: 48, color: '#ff4d4f' }} />
          <Typography variant="h5" color="error">
            مقدم الخدمة غير موجود
          </Typography>
          <Typography variant="body2" color="text.secondary">
            تأكد من صحة الرابط أو أن مقدم الخدمة لم يتم حذفه
          </Typography>
          <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate('/providers')}>
            العودة إلى القائمة
          </Button>
        </Stack>
      </MainCard>
    );
  }

  // Derive values defensively
  const providerName = provider?.name ?? '—';
  const providerDisplayName = providerName;
  const providerStatus = getProviderStatus(provider);
  const networkTier = getNetworkTier(provider);

  return (
    <>
      <ModernPageHeader
        title={`مقدم الخدمة: ${providerDisplayName}`}
        subtitle={`نوع مقدم الخدمة: ${PROVIDER_TYPE_LABELS[provider?.providerType] ?? provider?.providerType ?? '—'}`}
        icon={ProviderIcon}
        breadcrumbs={[{ label: 'مقدمو الخدمات', path: '/providers' }, { label: providerDisplayName }]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/providers/edit/${id}`)}>
              تعديل
            </Button>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/providers')}>
              عودة
            </Button>
          </Stack>
        }
      />

      <MainCard>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          {/* Provider Type Chip */}
          <Chip
            label={PROVIDER_TYPE_LABELS[provider?.providerType] ?? provider?.providerType ?? '—'}
            color={PROVIDER_TYPE_COLORS[provider?.providerType] || 'default'}
            size="small"
            variant="outlined"
          />
          {/* Network Status Badge */}
          {networkTier && <NetworkBadge networkTier={networkTier} showLabel={true} size="small" language="ar" />}
          {/* Status Badge */}
          <CardStatusBadge
            status={providerStatus}
            customLabel={STATUS_LABELS_AR[providerStatus] ?? 'غير محدد'}
            size="small"
            variant="chip"
          />
        </Stack>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Badge sx={{ color: '#1890ff' }} />
                <Typography variant="h5">البيانات الأساسية</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    الرمز التلقائي
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.id ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    اسم مقدم الخدمة
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {providerName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    رقم الترخيص
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.licenseNumber ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    الرقم الضريبي
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.taxNumber ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    نوع مقدم الخدمة
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={PROVIDER_TYPE_LABELS[provider?.providerType] ?? provider?.providerType ?? '—'}
                      color={PROVIDER_TYPE_COLORS[provider?.providerType] || 'default'}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    الحالة التشغيلية
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <CardStatusBadge
                      status={providerStatus}
                      customLabel={STATUS_LABELS_AR[providerStatus] ?? 'غير محدد'}
                      size="small"
                      variant="chip"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Location & Contact Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Phone sx={{ color: '#52c41a' }} />
                <Typography variant="h5">بيانات التواصل</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn sx={{ fontSize: 18, color: '#8c8c8c' }} />
                    <Typography variant="body2" color="text.secondary">
                      المدينة
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5, mr: 3 }}>
                    {provider?.city ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn sx={{ fontSize: 18, color: '#8c8c8c' }} />
                    <Typography variant="body2" color="text.secondary">
                      العنوان
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5, mr: 3 }}>
                    {provider?.address ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Phone sx={{ fontSize: 18, color: '#8c8c8c' }} />
                    <Typography variant="body2" color="text.secondary">
                      رقم الهاتف
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5, mr: 3 }}>
                    {provider?.phone ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Email sx={{ fontSize: 18, color: '#8c8c8c' }} />
                    <Typography variant="body2" color="text.secondary">
                      البريد الإلكتروني
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5, mr: 3 }}>
                    {provider?.email ?? '—'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Contract Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <VerifiedUser sx={{ color: '#faad14' }} />
                <Typography variant="h5">معلومات العقد والتشغيل</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    تاريخ بداية العقد
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.contractStartDate ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    تاريخ نهاية العقد
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.contractEndDate ?? '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    نسبة الخصم الافتراضية
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.defaultDiscountRate ? `${provider.defaultDiscountRate}%` : '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    تاريخ الإنشاء
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.createdAt ? new Date(provider.createdAt).toLocaleDateString('ar-SA') : '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    آخر تحديث
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {provider?.updatedAt ? new Date(provider.updatedAt).toLocaleDateString('ar-SA') : '—'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Provider Contracts */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VerifiedUser sx={{ color: '#1890ff' }} />
                  <Typography variant="h5">عقود مقدم الخدمة</Typography>
                </Stack>
                <Button
                  vocab="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenContractDialog}
                >
                  إضافة عقد
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {loadingContracts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : !Array.isArray(contracts) || contracts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  لا توجد عقود لهذا المزود
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>رقم العقد</TableCell>
                        <TableCell>تاريخ البداية</TableCell>
                        <TableCell>تاريخ النهاية</TableCell>
                        <TableCell>نسبة الخصم</TableCell>
                        <TableCell>التجديد التلقائي</TableCell>
                        <TableCell>الحالة</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(contracts) &&
                        contracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>{contract.contractNumber}</TableCell>
                            <TableCell>{contract.startDate ? new Date(contract.startDate).toLocaleDateString('ar-SA') : '-'}</TableCell>
                            <TableCell>{contract.endDate ? new Date(contract.endDate).toLocaleDateString('ar-SA') : '-'}</TableCell>
                            <TableCell>{contract.discountRate ? `${contract.discountRate}%` : '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={contract.autoRenew ? 'نعم' : 'لا'}
                                color={contract.autoRenew ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={contract.active ? 'نشط' : 'غير نشط'}
                                color={contract.active ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="حذف العقد">
                                <IconButton color="error" size="small" onClick={() => handleDeleteContract(contract.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </MainCard>

      {/* Contract Dialog */}
      <Dialog open={openContractDialog} onClose={() => setOpenContractDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة عقد جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="رقم العقد"
                value={contractForm.contractNumber}
                onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="تاريخ البداية"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={contractForm.startDate}
                onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="تاريخ النهاية"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={contractForm.endDate}
                onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="نسبة الخصم %"
                type="number"
                value={contractForm.discountRate}
                onChange={(e) => setContractForm({ ...contractForm, discountRate: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={contractForm.autoRenew} onChange={(e) => setContractForm({ ...contractForm, autoRenew: e.target.checked })} />}
                label="تجديد تلقائي"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContractDialog(false)}>إلغاء</Button>
          <Button onClick={handleSaveContract} variant="contained" color="primary">حفظ</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProviderView;
