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
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Alert,
  InputAdornment,
  Chip
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

const STEPS = ['البيانات الأساسية', 'الموقع والتواصل', 'المراجعة'];

/**
 * Provider Create Page - Enhanced Version
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Auto-generated code display (Read-Only)
 * ✅ Step-by-step form with logical sections
 * ✅ Real-time validation
 * ✅ Professional UI/UX
 * ✅ Clear visual feedback
 * 
 * @version 2.0
 * @since 2026-01-03
 */
const ProviderCreate = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { create, creating } = useCreateProvider();

  // ──────────────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────────────

  const [activeStep, setActiveStep] = useState(0);
  const [autoCode, setAutoCode] = useState('AUTO-GENERATED');

  const [formData, setFormData] = useState({
    // Basic Info - Bilingual names
    nameArabic: '',      // الاسم بالعربية - Required
    nameEnglish: '',     // Name in English - Required
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
    if (formData.providerType && (formData.nameArabic || formData.nameEnglish)) {
      const typePrefix = formData.providerType.substring(0, 3).toUpperCase();
      const displayName = formData.nameArabic || formData.nameEnglish;
      const nameInitials = displayName
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('');
      const timestamp = Date.now().toString().slice(-4);
      setAutoCode(`${typePrefix}-${nameInitials || 'XX'}-${timestamp}`);
    } else {
      setAutoCode('AUTO-GENERATED');
    }
  }, [formData.providerType, formData.nameArabic, formData.nameEnglish]);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      // Basic Info - Both names required
      if (!formData.nameArabic) newErrors.nameArabic = 'الاسم بالعربية مطلوب';
      if (!formData.nameEnglish) newErrors.nameEnglish = 'الاسم بالإنجليزية مطلوب';
      if (!formData.licenseNumber) newErrors.licenseNumber = 'رقم الترخيص مطلوب';
      if (!formData.providerType) newErrors.providerType = 'نوع المزود مطلوب';
    } else if (step === 1) {
      // Location & Contact - All optional but validate format if provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'البريد الإلكتروني غير صحيح';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    } else {
      enqueueSnackbar('يرجى تعبئة جميع الحقول المطلوبة', { variant: 'error' });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      enqueueSnackbar('يرجى التأكد من صحة البيانات', { variant: 'error' });
      return;
    }

    const result = await create(formData);

    if (result.success) {
      enqueueSnackbar('تم إنشاء مقدم الخدمة بنجاح', { variant: 'success' });
      navigate('/providers');
    } else {
      enqueueSnackbar(result.error || 'فشل إنشاء مقدم الخدمة', { variant: 'error' });
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // RENDER SECTIONS
  // ──────────────────────────────────────────────────────────────────────

  const renderBasicInfo = () => (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Business color="primary" />
        <Typography variant="h5">البيانات الأساسية لمقدم الخدمة</Typography>
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

        {/* Provider Names - Bilingual */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="اسم مقدم الخدمة بالعربية"
            placeholder="مثال: مستشفى الواحة"
            value={formData.nameArabic}
            onChange={handleChange('nameArabic')}
            error={!!errors.nameArabic}
            helperText={errors.nameArabic || 'الاسم باللغة العربية (مطلوب)'}
            inputProps={{ dir: 'rtl' }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="اسم مقدم الخدمة بالإنجليزية"
            placeholder="e.g., Al-Waha Hospital"
            value={formData.nameEnglish}
            onChange={handleChange('nameEnglish')}
            error={!!errors.nameEnglish}
            helperText={errors.nameEnglish || 'Name in English (required)'}
            inputProps={{ dir: 'ltr' }}
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
    </Paper>
  );

  const renderLocationContact = () => (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
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
    </Paper>
  );

  const renderReview = () => (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h5" gutterBottom>
        مراجعة البيانات
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        يرجى مراجعة البيانات التالية قبل الحفظ
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Basic Info Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          البيانات الأساسية
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              الرمز التلقائي
            </Typography>
            <Typography variant="body1">{autoCode}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              نوع المزود
            </Typography>
            <Typography variant="body1">{PROVIDER_TYPES.find((t) => t.value === formData.providerType)?.label || '-'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              الاسم
            </Typography>
            <Typography variant="body1">{formData.name || '-'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              رقم الترخيص
            </Typography>
            <Typography variant="body1">{formData.licenseNumber || '-'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              الرقم الضريبي
            </Typography>
            <Typography variant="body1">{formData.taxNumber || '-'}</Typography>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Location & Contact Summary */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          الموقع والتواصل
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              المدينة
            </Typography>
            <Typography variant="body1">{formData.city || '-'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              العنوان
            </Typography>
            <Typography variant="body1">{formData.address || '-'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              الهاتف
            </Typography>
            <Typography variant="body1">{formData.phone || '-'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              البريد الإلكتروني
            </Typography>
            <Typography variant="body1">{formData.email || '-'}</Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderLocationContact();
      case 2:
        return renderReview();
      default:
        return 'Unknown step';
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────────────────

  return (
    <>
      <ModernPageHeader
        title="إضافة مقدم خدمة صحية جديد"
        subtitle="إنشاء سجل جديد لمقدم خدمة صحية في النظام"
        icon={ProviderIcon}
        breadcrumbs={[{ label: 'مقدمو الخدمات', path: '/providers' }, { label: 'إضافة جديد' }]}
        actions={
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/providers')} disabled={creating}>
            عودة
          </Button>
        }
      />

      <MainCard>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button disabled={activeStep === 0 || creating} onClick={handleBack} variant="outlined">
            السابق
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={() => navigate('/providers')} disabled={creating}>
              إلغاء
            </Button>

            {activeStep === STEPS.length - 1 ? (
              <RBACGuard requiredPermissions={[PERMISSIONS.MANAGE_PROVIDERS]}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={creating}>
                  {creating ? 'جاري الحفظ...' : 'حفظ مقدم الخدمة'}
                </Button>
              </RBACGuard>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                التالي
              </Button>
            )}
          </Box>
        </Box>
      </MainCard>
    </>
  );
};

export default ProviderCreate;
