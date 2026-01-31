/**
 * ============================================================================
 * Company Settings Page - System Branding & Identity
 * ============================================================================
 *
 * Page for managing TBA company information, branding, and identity.
 *
 * Features:
 * - Edit company name, code, and status
 * - Branding: logo, business type
 * - Contact info: phone, email, address, website
 * - Tax/registration details
 * - Form validation
 * - Auto-save with success/error notifications
 * - RTL support
 *
 * Architecture:
 * - Single company context (no multi-tenant)
 * - Uses useSystemCompany() hook (no hardcoded codes)
 * - All branding fields optional (if empty, not displayed)
 *
 * Permissions Required:
 * - SUPER_ADMIN or MANAGE_COMPANIES
 *
 * @created 2026-01-02
 * @updated 2026-01-02 - Added branding fields
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Tabs,
  Tab,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
  Business as BusinessIcon,
  ContactSupport as ContactIcon,
  Palette as PaletteIcon,
  SettingsApplications as AdvancedIcon
} from '@mui/icons-material';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import RBACGuard from 'components/tba/RBACGuard';
import { useSystemCompany, useUpdateCompany } from 'hooks/useCompany';
import { useCompanySettings } from 'contexts/CompanySettingsContext';
import useConfig from 'hooks/useConfig';

// Default static logo fallback
import waadLogoFallback from 'assets/images/waad-logo.png';

/**
 * TabPanel Component - Controls visibility of tab content
 */
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CompanySettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const { refreshSettings } = useCompanySettings();
  const { setField } = useConfig();

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    code: '',
    businessType: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    taxNumber: '',
    currency: 'SAR',
    cardNumberFormat: '[PRO]-[YEAR]-[EMP_NO][REL_SUFFIX]',
    fontSize: 12,
    barcodePrefix: 'WAAD'
  });

  const [errors, setErrors] = useState({});

  const { data: company, isLoading, error } = useSystemCompany();
  const updateCompanyMutation = useUpdateCompany();

  useEffect(() => {
    if (company?.data) {
      const companyData = company.data;
      setFormData({
        id: companyData.id,
        name: companyData.name || '',
        code: companyData.code || '',
        businessType: companyData.businessType || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        address: companyData.address || '',
        website: companyData.website || '',
        taxNumber: companyData.taxNumber || '',
        currency: companyData.currency || 'SAR',
        cardNumberFormat: companyData.cardNumberFormat || '[PRO]-[YEAR]-[EMP_NO][REL_SUFFIX]',
        logoUrl: companyData.logoUrl || '',
        fontFamily: companyData.fontFamily || 'Tajawal',
        fontSize: companyData.fontSize || 12,
        barcodePrefix: companyData.barcodePrefix || 'WAAD'
      });
    }
  }, [company]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'اسم الشركة مطلوب';
    if (!formData.code?.trim()) newErrors.code = 'كود الشركة مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { id, ...updateData } = formData;
    updateCompanyMutation.mutate({ id, data: updateData }, {
      onSuccess: () => {
        refreshSettings();
        // Update local config to reflect changes immediately for the admin
        if (formData.fontFamily) setField('fontFamily', formData.fontFamily);
        if (formData.fontSize) setField('fontSize', formData.fontSize);
      }
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 3 }}>حدث خطأ أثناء تحميل البيانات.</Alert>;
  }

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <ModernPageHeader
        title="إعدادات الشركة"
        subtitle="إدارة الهوية والمعلومات الأساسية للنظام"
        icon={<img src={formData.logoUrl || waadLogoFallback} alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={(e) => e.target.src = waadLogoFallback} />}
      />

      <Card sx={{ mt: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', mb: 1 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 48 }}>
            <Tab icon={<BusinessIcon fontSize="small" />} label="بيانات المؤسسة والتواصل" iconPosition="start" sx={{ minHeight: 48, fontSize: '12px' }} />
            <Tab icon={<PaletteIcon fontSize="small" />} label="الهوية والنمط" iconPosition="start" sx={{ minHeight: 48, fontSize: '12px' }} />
            <Tab icon={<AdvancedIcon fontSize="small" />} label="إعدادات متقدمة" iconPosition="start" sx={{ minHeight: 48, fontSize: '12px' }} />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {/* General & Contact Combined Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth size="small" label="اسم الشركة" value={formData.name} onChange={handleChange('name')} error={!!errors.name} helperText={errors.name} required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" label="كود الشركة" value={formData.code} onChange={handleChange('code')} error={!!errors.code} helperText={errors.code} required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" label="نوع النشاط" value={formData.businessType} onChange={handleChange('businessType')} />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth size="small" label="الهاتف" value={formData.phone} onChange={handleChange('phone')} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth size="small" label="البريد الإلكتروني" value={formData.email} onChange={handleChange('email')} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth size="small" label="الموقع الإلكتروني" value={formData.website} onChange={handleChange('website')} />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField fullWidth size="small" label="العنوان" value={formData.address} onChange={handleChange('address')} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth size="small" label="الرقم الضريبي" value={formData.taxNumber} onChange={handleChange('taxNumber')} />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Branding & Scaling Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h5" gutterBottom color="primary">خط النظام المفضل</Typography>
                  <FormControl component="fieldset">
                    <RadioGroup row value={formData.fontFamily} onChange={handleChange('fontFamily')}>
                      <FormControlLabel value="Tajawal" control={<Radio size="small" />} label={<span style={{ fontFamily: 'Tajawal' }}>خط تجوال (Tajawal)</span>} />
                      <FormControlLabel value="Cairo" control={<Radio size="small" />} label={<span style={{ fontFamily: 'Cairo' }}>خط كايرو (Cairo)</span>} />
                    </RadioGroup>
                  </FormControl>

                  <Typography variant="h5" gutterBottom color="primary" sx={{ mt: 3 }}>حجم خط المنظومة (Scaling)</Typography>
                  <FormControl component="fieldset">
                    <RadioGroup row value={formData.fontSize} onChange={(e) => setFormData(p => ({ ...p, fontSize: parseInt(e.target.value) }))}>
                      <FormControlLabel value={12} control={<Radio size="small" />} label={<span>صغير (12px)</span>} />
                      <FormControlLabel value={14} control={<Radio size="small" />} label={<span>متوسط (14px)</span>} />
                      <FormControlLabel value={16} control={<Radio size="small" />} label={<span>كبير (16px)</span>} />
                      <FormControlLabel value={18} control={<Radio size="small" />} label={<span>ضخم (18px)</span>} />
                    </RadioGroup>
                  </FormControl>
                  <Alert severity="info" sx={{ mt: 2 }}>سيتم ضبط العناوين لتكون أكبر بدرجتين (+2px) من الحجم المختار تلقائياً.</Alert>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h5" gutterBottom color="primary">شعار المؤسسة</Typography>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '12px', border: '1px solid', borderColor: 'divider', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                      <img src={formData.logoUrl || waadLogoFallback} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} onError={(e) => e.target.src = waadLogoFallback} />
                    </Box>
                    <Stack spacing={1} flex={1}>
                      <TextField fullWidth size="small" label="رابط الشعار" value={formData.logoUrl} onChange={handleChange('logoUrl')} />
                      <Button variant="outlined" component="label" size="small" startIcon={<CloudUploadIcon />}>
                        رفع من الجهاز
                        <input type="file" hidden accept="image/*" onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setFormData(p => ({ ...p, logoUrl: reader.result }));
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }} />
                      </Button>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Advanced Numbering Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 0.5 }}>العملة والمالية</Typography>
                  <Box sx={{ maxWidth: 300 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="عملة النظام"
                      value={formData.currency}
                      onChange={handleChange('currency')}
                      helperText="مثال: SAR, USD, JOD"
                    />
                  </Box>
                </Grid>


                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="h5" gutterBottom color="primary" sx={{ mt: 0.5, mb: 0.5 }}>إعدادات الترقيم المتقدم</Typography>
                  {/* Admin Only Barcode Prefix */},
                  <Grid container spacing={2} alignItems="flex-start">
                    {/* Card Number Format (Right in RTL) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>الرموز المتاحة:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <code>[PRO]</code>: <span>رمز المزود (أول 3 حروف)</span>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <code>[YEAR]</code>: <span>السنة الحالية</span>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <code>[EMP_NO]</code>: <span>الرقم الوظيفي</span>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <code>[REL_SUFFIX]</code>: <span>لاحقة القرابة (W=زوجة, S=ابن, D=ابنة, F=أب, M=أم, H=زوج)</span>
                          </Box>
                        </Box>
                      </Alert>
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        تغيير هذا التنسيق سيؤثر على جميع أرقام البطاقات التي سيتم إصدارها مستقبلاً.
                      </Alert>
                      <TextField
                        fullWidth
                        size="small"
                        label="تنسيق رقم البطاقة"
                        value={formData.cardNumberFormat}
                        onChange={handleChange('cardNumberFormat')}
                        placeholder="[PRO]-[YEAR]-[EMP_NO][REL_SUFFIX]"
                      />
                    </Grid>

                    {/* Admin Only Barcode Prefix (Left in RTL) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <RBACGuard requiredRoles={['SUPER_ADMIN']}>
                        <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1, border: '1px dashed', borderColor: 'error.main' }}>
                          <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                            ⚠️ منطقة إدارة النظام (System Manager Only)
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            label="بادئة الباركود المعتمدة (System Prefix)"
                            value={formData.barcodePrefix}
                            onChange={handleChange('barcodePrefix')}
                            helperText="يظهر في بداية الباركود (مثل: WAAD-XXXX)."
                          />
                        </Box>
                      </RBACGuard>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>

          <Divider />
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.paper' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="medium"
              startIcon={updateCompanyMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
              disabled={updateCompanyMutation.isPending}
              onClick={handleSubmit}
              sx={{ minWidth: 150, borderRadius: 1.5, height: 40 }}
            >
              {updateCompanyMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default CompanySettingsPage;
