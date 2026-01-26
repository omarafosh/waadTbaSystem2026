import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Box, Button, Grid, TextField, MenuItem, Typography, CircularProgress } from '@mui/material';
import { ArrowBack, Save, LocalHospital as ProviderIcon } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { useProviderDetails, useUpdateProvider } from 'hooks/useProviders';

const PROVIDER_TYPES = [
  { value: 'HOSPITAL', label: 'مستشفى' },
  { value: 'CLINIC', label: 'عيادة' },
  { value: 'LAB', label: 'مختبر' },
  { value: 'PHARMACY', label: 'صيدلية' },
  { value: 'RADIOLOGY', label: 'مركز أشعة' }
];

const NETWORK_STATUS_OPTIONS = [
  { value: 'IN_NETWORK', label: 'داخل الشبكة', description: 'مقدم خدمة معتمد داخل الشبكة' },
  { value: 'OUT_OF_NETWORK', label: 'خارج الشبكة', description: 'مقدم خدمة خارج الشبكة' },
  { value: 'PREFERRED', label: 'مزود مفضل', description: 'مقدم خدمة مفضل بخصومات أعلى' }
];

const ProviderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { provider, loading } = useProviderDetails(id);
  const { update, updating } = useUpdateProvider();

  const [formData, setFormData] = useState({
    nameArabic: '',      // الاسم بالعربية
    nameEnglish: '',     // Name in English
    licenseNumber: '',
    taxNumber: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    providerType: '',
    networkStatus: '',
    contractStartDate: '',
    contractEndDate: '',
    defaultDiscountRate: '',
    active: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (provider) {
      setFormData({
        nameArabic: provider.nameArabic || provider.name || '',
        nameEnglish: provider.nameEnglish || provider.name || '',
        licenseNumber: provider.licenseNumber || '',
        taxNumber: provider.taxNumber || '',
        city: provider.city || '',
        address: provider.address || '',
        phone: provider.phone || '',
        email: provider.email || '',
        providerType: provider.providerType || '',
        networkStatus: provider.networkStatus || '',
        contractStartDate: provider.contractStartDate || '',
        contractEndDate: provider.contractEndDate || '',
        defaultDiscountRate: provider.defaultDiscountRate || '',
        active: provider.active !== undefined ? provider.active : true
      });
    }
  }, [provider]);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nameArabic) newErrors.nameArabic = 'الاسم بالعربية مطلوب';
    if (!formData.nameEnglish) newErrors.nameEnglish = 'الاسم بالإنجليزية مطلوب';
    if (!formData.licenseNumber) newErrors.licenseNumber = 'رقم الترخيص مطلوب';
    if (!formData.providerType) newErrors.providerType = 'نوع المزود مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      enqueueSnackbar('يرجى تعبئة جميع الحقول المطلوبة', { variant: 'error' });
      return;
    }

    const result = await update(id, formData);

    if (result.success) {
      enqueueSnackbar('تم تحديث المزود بنجاح', { variant: 'success' });
      navigate('/providers');
    } else {
      enqueueSnackbar(result.error || 'فشل تحديث المزود', { variant: 'error' });
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

  return (
    <>
      <ModernPageHeader
        title="تعديل بيانات مقدم الخدمة الصحية"
        subtitle="تحديث سجل مقدم الخدمة الصحية"
        icon={ProviderIcon}
        breadcrumbs={[{ label: 'مقدمو الخدمات', path: '/providers' }, { label: 'تعديل' }]}
        actions={
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/providers')} disabled={updating}>
            عودة
          </Button>
        }
      />

      <MainCard>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                البيانات الأساسية لمقدم الخدمة
              </Typography>
            </Grid>

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
                label="رقم الترخيص"
                value={formData.licenseNumber}
                onChange={handleChange('licenseNumber')}
                error={!!errors.licenseNumber}
                helperText={errors.licenseNumber}
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="الرقم الضريبي" value={formData.taxNumber} onChange={handleChange('taxNumber')} />
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
                helperText={errors.providerType}
              >
                {PROVIDER_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
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
                helperText="موقع المزود في الشبكة (اختياري)"
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
                select
                label="الحالة التشغيلية"
                value={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
              >
                <MenuItem value={true}>نشط</MenuItem>
                <MenuItem value={false}>غير نشط</MenuItem>
              </TextField>
            </Grid>

            {/* Location Information */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                معلومات الموقع
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="المدينة" value={formData.city} onChange={handleChange('city')} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="العنوان" value={formData.address} onChange={handleChange('address')} multiline rows={1} />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                معلومات الاتصال
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="رقم الهاتف" value={formData.phone} onChange={handleChange('phone')} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth type="email" label="البريد الإلكتروني" value={formData.email} onChange={handleChange('email')} />
            </Grid>

            {/* Contract Information */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                معلومات العقد
              </Typography>
            </Grid>

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

            {/* Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/providers')} disabled={updating}>
                  إلغاء
                </Button>
                <Button type="submit" variant="contained" startIcon={<Save />} disabled={updating}>
                  {updating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </MainCard>
    </>
  );
};

export default ProviderEdit;
