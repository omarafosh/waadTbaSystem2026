/**
 * Medical Service Create Page - CLEANED & FIXED
 * 
 * ✅ CORRECT Fields (Reference Data Only):
 * - code (required, unique)
 * - name (required)  
 * - categoryId (required)
 * - description (optional)
 * - basePrice (optional - reference only)
 * - requiresPreApproval (boolean)
 * - active (boolean)
 * 
 * ❌ REMOVED (Coverage belongs in Benefit Policy Rules):
 * - coverageLimit
 * - coveragePercent
 * - duration
 * - cost (Removed from contract)
 * 
 * Permissions: SUPER_ADMIN, INSURANCE_ADMIN
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI Components
import {
  Box,
  Button,
  Grid,
  Alert,
  TextField,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  InputAdornment
} from '@mui/material';

// MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

// Project Components
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';

// Contexts
import { useTableRefresh } from 'contexts/TableRefreshContext';

// Hooks & Services
import { createMedicalService } from 'services/api/medical-services.service';
import { useAllMedicalCategories } from 'hooks/useMedicalCategories';

// Snackbar
import { openSnackbar } from 'api/snackbar';

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_FORM_STATE = {
  code: '',
  name: '',
  categoryId: '',
  description: '',
  basePrice: '',
  requiresPA: false,
  active: true
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MedicalServiceCreate = () => {
  const navigate = useNavigate();
  const { triggerRefresh } = useTableRefresh();

  // ========================================
  // DATA FETCHING
  // ========================================

  const { data: categories, loading: categoriesLoading } = useAllMedicalCategories();

  const categoryList = useMemo(() => {
    if (!categories) return [];
    return Array.isArray(categories) ? categories : [];
  }, [categories]);

  // ========================================
  // STATE
  // ========================================

  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ========================================
  // HANDLERS
  // ========================================

  const handleChange = useCallback(
    (field) => (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.code?.trim()) newErrors.code = 'الرمز مطلوب';
    if (!form.name?.trim()) newErrors.name = 'الاسم مطلوب';
    if (!form.categoryId) newErrors.categoryId = 'التصنيف مطلوب';

    // Validate price if provided
    if (form.basePrice && parseFloat(form.basePrice) < 0) {
      newErrors.basePrice = 'السعر يجب أن يكون أكبر من صفر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validate()) return;

      setSubmitting(true);
      setApiError(null);

      try {
        const payload = {
          code: form.code?.trim() || '',
          name: form.name?.trim() || '',
          categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
          description: form.description?.trim() || null,
          basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
          requiresPA: Boolean(form.requiresPA),
          active: Boolean(form.active)
        };

        await createMedicalService(payload);

        openSnackbar({
          message: 'تم إنشاء الخدمة الطبية بنجاح',
          variant: 'success'
        });

        triggerRefresh();
        navigate('/medical-services');
      } catch (err) {
        console.error('[MedicalServiceCreate] Submit failed:', err);
        const errorMessage = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء إنشاء الخدمة';
        setApiError(errorMessage);
        openSnackbar({
          message: errorMessage,
          variant: 'error'
        });
      } finally {
        setSubmitting(false);
      }
    },
    [form, navigate, validate, triggerRefresh]
  );

  const handleBack = useCallback(() => navigate('/medical-services'), [navigate]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <Box>
      <ModernPageHeader
        title="إضافة خدمة طبية جديدة"
        subtitle="إنشاء خدمة طبية جديدة في النظام"
        icon={MedicalServicesIcon}
        breadcrumbs={[{ label: 'الخدمات الطبية', path: '/medical-services' }, { label: 'إضافة جديد' }]}
        actions={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            رجوع
          </Button>
        }
      />

      <MainCard>
        <Box component="form" onSubmit={handleSubmit}>
          {apiError && <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>}

          {/* ====== BASIC INFO SECTION ====== */}
          <Typography variant="h6" gutterBottom>المعلومات الأساسية</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Code */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="الرمز"
                placeholder="SRV001"
                value={form.code}
                onChange={handleChange('code')}
                error={!!errors.code}
                helperText={errors.code || 'رمز فريد للخدمة'}
                required
                disabled={submitting}
              />
            </Grid>

            {/* Name */}
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="الاسم"
                placeholder="أدخل اسم الخدمة"
                value={form.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
                disabled={submitting}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.categoryId} required disabled={submitting || categoriesLoading}>
                <InputLabel>التصنيف الطبي</InputLabel>
                <Select value={form.categoryId} onChange={handleChange('categoryId')} label="التصنيف الطبي">
                  <MenuItem value="">-- اختر التصنيف --</MenuItem>
                  {categoryList.map((cat) => (
                    <MenuItem key={cat?.id} value={cat?.id}>
                      {cat?.name || cat?.nameEn || '-'}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الوصف"
                placeholder="أدخل وصف الخدمة (اختياري)"
                value={form.description}
                onChange={handleChange('description')}
                multiline
                rows={2}
                disabled={submitting}
              />
            </Grid>
          </Grid>

          {/* ====== PRICING SECTION (Reference Only) ====== */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            التسعير (مرجعي فقط)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            ⚠️ هذه الأسعار مرجعية فقط - الأسعار الفعلية تحدد في عقود مقدمي الخدمات
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Base Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="السعر الأساسي (مرجعي)"
                placeholder="0.00"
                type="number"
                value={form.basePrice}
                onChange={handleChange('basePrice')}
                error={!!errors.basePrice}
                helperText={errors.basePrice || 'السعر المرجعي للخدمة'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">د.ل</InputAdornment>
                }}
                inputProps={{ step: '0.01', min: '0' }}
                disabled={submitting}
              />
            </Grid>


          </Grid>

          {/* ====== SETTINGS SECTION ====== */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            الإعدادات
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Active Switch */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body1">تفعيل الخدمة</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {form.active ? 'الخدمة نشطة وظاهرة في النظام' : 'الخدمة غير نشطة ولن تظهر'}
                  </Typography>
                </Box>
                <Switch checked={form.active} onChange={handleChange('active')} disabled={submitting} />
              </Box>
            </Grid>
          </Grid>

          {/* ====== ACTION BUTTONS ====== */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleBack} disabled={submitting}>
              إلغاء
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'حفظ الخدمة'}
            </Button>
          </Box>
        </Box>
      </MainCard>
    </Box>
  );
};

export default MedicalServiceCreate;
