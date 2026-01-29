import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Tabs,
  Tab,
  Divider,
  Alert,
  InputAdornment,
  Chip,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Save,
  LocalHospital as ProviderIcon,
  Business,
  LocationOn,
  Phone,
  Description
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';
import { useCreateProvider } from 'hooks/useProviders';

const PROVIDER_TYPES = [
  { value: 'HOSPITAL', label: 'مستشفى', icon: '🏥' },
  { value: 'CLINIC', label: 'عيادة', icon: '🏥' },
  { value: 'LAB', label: 'مختبر', icon: '🔬' },
  { value: 'PHARMACY', label: 'صيدلية', icon: '💊' },
  { value: 'RADIOLOGY', label: 'مركز أشعة', icon: '📷' }
];

const NETWORK_STATUS_OPTIONS = [
  { value: 'IN_NETWORK', label: 'داخل الشبكة', description: 'مقدم خدمة معتمد داخل الشبكة' },
  { value: 'OUT_OF_NETWORK', label: 'خارج الشبكة', description: 'مقدم خدمة خارج الشبكة' },
  { value: 'PREFERRED', label: 'مزود مفضل', description: 'مقدم خدمة مفضل بخصومات أعلى' }
];

// MOCK_PAYERS removed as requested to use real data only


/**
 * Provider Create Page - Tabbed Version
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Tabbed Interface (Basic, Location, Partners)
 * ✅ Allowed Partners Management
 * ✅ Auto-generated code display
 * 
 * @version 2.1
 * @since 2026-01-27
 */
const ProviderCreate = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { create, creating } = useCreateProvider();

  // ──────────────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState(0);
  const [autoCode, setAutoCode] = useState('AUTO-GENERATED');

  const [formData, setFormData] = useState({
    // Basic Info
    name: '',            // اسم مقدم الخدمة - Required
    licenseNumber: '',
    taxNumber: '',
    providerType: '',
    networkStatus: '',

    // Location & Contact
    city: '',
    address: '',
    phone: '',
    email: '',

    // Contract (Optional - for initial setup)
    contractStartDate: '',
    contractEndDate: '',
    defaultDiscountRate: ''
  });

  const [errors, setErrors] = useState({});

  // ──────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ──────────────────────────────────────────────────────────────────────

  // Generate auto code when provider type and name are filled
  useEffect(() => {
    if (formData.providerType && formData.name) {
      const typePrefix = formData.providerType.substring(0, 3).toUpperCase();
      const nameInitials = formData.name
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('');
      const timestamp = Date.now().toString().slice(-4);
      setAutoCode(`${typePrefix}-${nameInitials || 'XX'}-${timestamp}`);
    } else {
      setAutoCode('AUTO-GENERATED');
    }
  }, [formData.providerType, formData.name]);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic Info Validation
    if (!formData.name) newErrors.name = 'اسم مقدم الخدمة مطلوب';
    if (!formData.licenseNumber) newErrors.licenseNumber = 'رقم الترخيص مطلوب';
    if (!formData.providerType) newErrors.providerType = 'نوع المزود مطلوب';

    // Contact Info Validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    setErrors(newErrors);

    // Switch to first tab with error
    if (newErrors.name || newErrors.licenseNumber || newErrors.providerType) {
      setActiveTab(0);
    } else if (newErrors.email) {
      setActiveTab(1);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      enqueueSnackbar('يرجى التأكد من صحة البيانات في جميع التبويبات', { variant: 'error' });
      return;
    }

    const payload = {
      ...formData
    };

    const result = await create(payload);

    if (result.success) {
      enqueueSnackbar('تم إنشاء مقدم الخدمة بنجاح - يمكنك الآن إضافة المستندات والمستخدمين', { variant: 'success' });
      // Smart Redirect: Go to edit page to allow adding documents immediately
      const newId = result.data?.id || result.data?.data?.id || result.data;
      if (newId) {
        navigate(`/providers/edit/${newId}`);
      } else {
        navigate('/providers');
      }
    } else {
      enqueueSnackbar(result.error || 'فشل إنشاء مقدم الخدمة', { variant: 'error' });
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // RENDER SECTIONS
  // ──────────────────────────────────────────────────────────────────────

  const renderBasicInfo = () => (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Business color="primary" />
        <Typography variant="h5">البيانات الأساسية</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Auto-Generated Code - READ ONLY */}
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>الرمز التلقائي:</strong> سيتم إنشاء رمز تلقائي لمقدم الخدمة عند الحفظ
            </Typography>
          </Alert>
          <TextField
            fullWidth
            label="الرمز التلقائي (Auto-Generated Code)"
            value={autoCode}
            disabled
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Chip label="AUTO" size="small" color="primary" />
                </InputAdornment>
              )
            }}
            helperText="سيتم توليد الرمز تلقائياً بناءً على النوع والاسم"
          />
        </Grid>

        {/* Provider Name */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="اسم مقدم الخدمة"
            placeholder="مثال: مستشفى الواحة"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name || 'اسم مقدم الخدمة (مطلوب)'}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            select
            label="نوع مقدم الخدمة"
            value={formData.providerType}
            onChange={handleChange('providerType')}
            error={!!errors.providerType}
            helperText={errors.providerType || 'اختر نوع الجهة الصحية'}
          >
            {PROVIDER_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="حالة الشبكة"
            value={formData.networkStatus}
            onChange={handleChange('networkStatus')}
            helperText="اختر موقع المزود في الشبكة (اختياري)"
          >
            <MenuItem value="">
              <em>غير محدد</em>
            </MenuItem>
            {NETWORK_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box>
                  <Typography variant="body1">{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="رقم الترخيص"
            value={formData.licenseNumber}
            onChange={handleChange('licenseNumber')}
            error={!!errors.licenseNumber}
            helperText={errors.licenseNumber || 'رقم ترخيص وزارة الصحة'}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="الرقم الضريبي (اختياري)"
            value={formData.taxNumber}
            onChange={handleChange('taxNumber')}
            helperText="رقم التسجيل الضريبي إن وجد"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderLocationContact = () => (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LocationOn color="primary" />
        <Typography variant="h5">الموقع ومعلومات التواصل</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="المدينة"
            value={formData.city}
            onChange={handleChange('city')}
            helperText="مدينة مقر مقدم الخدمة"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="العنوان"
            value={formData.address}
            onChange={handleChange('address')}
            helperText="العنوان الكامل"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="رقم الهاتف"
            value={formData.phone}
            onChange={handleChange('phone')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone fontSize="small" />
                </InputAdornment>
              )
            }}
            helperText="رقم التواصل الرئيسي"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="email"
            label="البريد الإلكتروني"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email || 'البريد الإلكتروني للتواصل'}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Contract Info - Optional */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Description color="secondary" />
        <Typography variant="h6" color="text.secondary">
          معلومات العقد الأولية (اختياري)
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        يمكنك إضافة معلومات العقد لاحقاً من خلال صفحة العقود
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="date"
            label="تاريخ بداية العقد"
            value={formData.contractStartDate}
            onChange={handleChange('contractStartDate')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="date"
            label="تاريخ نهاية العقد"
            value={formData.contractEndDate}
            onChange={handleChange('contractEndDate')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="نسبة الخصم الافتراضية (%)"
            value={formData.defaultDiscountRate}
            onChange={handleChange('defaultDiscountRate')}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  // ──────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────────────────

  return (
    <>
      <ModernPageHeader
        title="إضافة مقدم خدمة صحية جديد"
        subtitle="إنشاء سجل جديد وتحديد صلاحيات الشركاء"
        icon={ProviderIcon}
        breadcrumbs={[{ label: 'مقدمو الخدمات', path: '/providers' }, { label: 'إضافة جديد' }]}
        actions={
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/providers')}
              disabled={creating}
              color="inherit"
            >
              عودة
            </Button>
            <RBACGuard requiredPermissions={[PERMISSIONS.MANAGE_PROVIDERS]}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSubmit}
                disabled={creating}
              >
                {creating ? 'جاري الحفظ...' : 'حفظ مقدم الخدمة'}
              </Button>
            </RBACGuard>
          </Stack>
        }
      />

      <MainCard>
        {/* Tabs Header */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="provider-create-tabs">
            <Tab icon={<Business />} label="البيانات الأساسية" iconPosition="start" />
            <Tab icon={<LocationOn />} label="الموقع والتواصل" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ mb: 4, minHeight: 400 }}>
          <Box role="tabpanel" hidden={activeTab !== 0}>
            {activeTab === 0 && renderBasicInfo()}
          </Box>
          <Box role="tabpanel" hidden={activeTab !== 1}>
            {activeTab === 1 && renderLocationContact()}
          </Box>
        </Box>

        {/* Global Save Button - Removed Duplicate */}
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => navigate('/providers')} disabled={creating} size="large">
            إلغاء
          </Button>
          {/* Main Save is now in Header */}
        </Box>
      </MainCard>
    </>
  );
};

export default ProviderCreate;
