/**
 * Medical Category Create Page - Phase D2.4 (Golden Reference Clone)
 * Cloned from Medical Services Golden Reference
 *
 * ⚠️ This is a REFERENCE implementation for all CRUD create pages.
 * Pattern: ModernPageHeader → MainCard → Form Sections → Actions
 *
 * Rules Applied:
 * 1. icon={Component} - NEVER JSX
 * 2. Arabic only - No English labels
 * 3. Array.isArray() for all lists
 * 4. Defensive optional chaining
 * 5. Form validation with Arabic messages
 * 6. TableRefreshContext for post-create refresh (Phase D2.3)
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI Components
import { Box, Button, Grid, Paper, Stack, TextField, Typography, FormControlLabel, Switch, Divider, Alert, MenuItem } from '@mui/material';

// MUI Icons - Always as Component, NEVER as JSX
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';

// Project Components
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';

// Contexts
import { useTableRefresh } from 'contexts/TableRefreshContext';

// Services
import { createMedicalCategory, getAllMedicalCategories } from 'services/api/medical-categories.service';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_FORM_STATE = {
  code: '',
  name: '', // Arabic Name
  nameEn: '', // English Name
  parentId: '', // Parent Category ID
  active: true
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MedicalCategoryCreate = () => {
  const navigate = useNavigate();
  const { triggerRefresh } = useTableRefresh();

  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllMedicalCategories();
        if (Array.isArray(data)) {
            setCategories(data);
        }
      } catch (error) {
        console.error('Failed to load parent categories', error);
      }
    };
    fetchCategories();
  }, []);

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
    if (!form.name?.trim()) newErrors.name = 'الاسم العربي مطلوب';
    if (!form.nameEn?.trim()) newErrors.nameEn = 'الاسم الإنجليزي مطلوب (اختياري لكن يفضل إضافته)';

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
          nameEn: form.nameEn?.trim() || null,
          parentId: form.parentId || null,
          active: form.active
        };

        await createMedicalCategory(payload);
        triggerRefresh();
        navigate('/medical-categories');
      } catch (err) {
        console.error('[MedicalCategoryCreate] Submit failed:', err);
        setApiError(err?.response?.data?.message || err?.message || 'حدث خطأ أثناء إنشاء التصنيف');
      } finally {
        setSubmitting(false);
      }
    },
    [form, navigate, validate, triggerRefresh]
  );

  const handleBack = useCallback(() => navigate('/medical-categories'), [navigate]);

  return (
    <Box>
      <ModernPageHeader
        title="إضافة تصنيف طبي"
        subtitle="إنشاء تصنيف جديد"
        icon={CategoryIcon}
        breadcrumbs={[
          { label: 'التصنيفات الطبية', path: '/medical-categories' },
          { label: 'إضافة جديد' }
        ]}
        actions={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            إلغاء
          </Button>
        }
      />

      <MainCard>
        <Box component="form" onSubmit={handleSubmit}>
          {apiError && <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>}

          <Grid container spacing={3}>
            {/* Code & Active on same row */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="رمز التصنيف"
                  placeholder="مثال: CONSULTATION"
                  value={form.code}
                  onChange={handleChange('code')}
                  error={!!errors.code}
                  helperText={errors.code || 'رمز فريد (غير قابل للتغيير لاحقاً)'}
                  disabled={submitting}
                  dir="ltr"
                  inputProps={{ style: { textAlign: 'right' } }} 
                />
              </Grid>
              
              <Grid item xs={12} md={6} display="flex" alignItems="center">
                 <FormControlLabel
                    control={<Switch checked={form.active} onChange={handleChange('active')} color="success" />}
                    label={form.active ? 'نشط' : 'غير نشط'}
                  />
              </Grid>
            
            {/* Name Arabic */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="الاسم (عربي)"
                placeholder="أدخل اسم التصنيف بالعربية"
                value={form.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                disabled={submitting}
              />
            </Grid>
            
             {/* Name English */}
             <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الاسم (إنجليزي - اختياري)"
                placeholder="Enter English Name"
                value={form.nameEn}
                onChange={handleChange('nameEn')}
                error={!!errors.nameEn}
                helperText={errors.nameEn}
                disabled={submitting}
                dir="ltr"
                 inputProps={{ style: { textAlign: 'right' } }}
              />
            </Grid>

            {/* Parent Category */}
            <Grid item xs={12} md={6}>
               <TextField
                  select
                  fullWidth
                  label="التصنيف الأب (اختياري)"
                  value={form.parentId}
                  onChange={handleChange('parentId')}
                  subheader="اختر التصنيف الرئيسي إذا كان هذا فرعاً"
                  SelectProps={{
                      displayEmpty: true
                  }}
                  disabled={submitting}
                 >
                    <MenuItem value="">
                        <em>(بدون أب - تصنيف رئيسي)</em>
                    </MenuItem>
                    {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat.code})
                        </MenuItem>
                    ))}
                 </TextField>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleBack} disabled={submitting}>
                  إلغاء
                </Button>
                <RBACGuard requiredPermissions={[PERMISSIONS.MANAGE_MEDICAL_CATEGORIES]}>
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={submitting}>
                    حفظ
                  </Button>
                </RBACGuard>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </MainCard>
    </Box>
  );
};

export default MedicalCategoryCreate;
