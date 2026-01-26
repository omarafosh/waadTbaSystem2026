/**
 * Medical Category Edit Page - Phase D2.4 (Golden Reference Clone)
 * Cloned from Medical Services Golden Reference
 *
 * ⚠️ This is a REFERENCE implementation for all CRUD edit pages.
 * Pattern: ModernPageHeader → MainCard → Form Sections → Actions
 *
 * Rules Applied:
 * 1. icon={Component} - NEVER JSX
 * 2. Arabic only - No English labels
 * 3. Array.isArray() for all lists
 * 4. Defensive optional chaining
 * 5. Proper error states (403 صلاحيات, 500 خطأ تقني)
 * 6. TableRefreshContext for post-edit refresh (Phase D2.3)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// MUI Components
import { Box, Button, Grid, Paper, Stack, TextField, Typography, FormControlLabel, Switch, Divider, Alert, Skeleton, MenuItem } from '@mui/material';

// MUI Icons - Always as Component, NEVER as JSX
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import LockIcon from '@mui/icons-material/Lock';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Project Components
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import ModernEmptyState from 'components/tba/ModernEmptyState';

// Contexts
import { useTableRefresh } from 'contexts/TableRefreshContext';

// Hooks & Services
import { useMedicalCategoryDetails } from 'hooks/useMedicalCategories';
import { updateMedicalCategory, getAllMedicalCategories } from 'services/api/medical-categories.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_FORM_STATE = {
  code: '',
  name: '', // Arabic
  nameEn: '', // English
  parentId: '', // Parent ID
  active: true
};

// ... (Helper functions remain the same) ...

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MedicalCategoryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerRefresh } = useTableRefresh();

  // Fetch details
  const { data: categoryData, loading: loadingCategory, error: loadError } = useMedicalCategoryDetails(id);

  // State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [categories, setCategories] = useState([]); // List for parent dropdown
  const [loadingParents, setLoadingParents] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Load Parent Categories for Dropdown
  useEffect(() => {
    let mounted = true;
    const fetchParents = async () => {
      try {
        setLoadingParents(true);
        const data = await getAllMedicalCategories();
        if (mounted) {
          // Filter out the current category itself to prevent circular reference
          const filtered = data.filter(c => String(c.id) !== id);
          setCategories(filtered);
        }
      } catch (err) {
        console.error('Failed to load parent categories:', err);
      } finally {
        if (mounted) setLoadingParents(false);
      }
    };
    fetchParents();
    
    return () => { mounted = false; };
  }, [id]);

  // Sync Form with Data
  useEffect(() => {
    if (categoryData) {
      setFormData({
        code: categoryData.code || '',
        name: categoryData.name || categoryData.nameAr || '',
        nameEn: categoryData.nameEn || '',
        parentId: categoryData.parentId || '',
        active: categoryData.active !== false
      });
    }
  }, [categoryData]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'اسم الفئة مطلوب';
    if (!formData.nameEn?.trim()) errors.nameEn = 'English Name is required';
    if (!formData.code?.trim()) errors.code = 'رمز الفئة مطلوب';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        // code is immutable, usually ignored by update endpoint but we send it
        name: formData.name,
        nameEn: formData.nameEn,
        parentId: formData.parentId || null,
        active: formData.active
      };

      await updateMedicalCategory(id, payload);
      triggerRefresh();
      // Navigate on success
      navigate('/medical-categories');
    } catch (error) {
      console.error('Update category failed:', error);
      setSubmitError(error.message || 'فشل تحديث الفئة الطبية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/medical-categories');

  if (loadingCategory) {
    return (
      <Box>
        <ModernPageHeader
          title="تعديل تصنيف طبي"
          subtitle="تحديث بيانات التصنيف الطبي"
          icon={CategoryIcon}
          breadcrumbs={[{ label: 'التصنيفات الطبية', path: '/medical-categories' }, { label: 'تعديل' }]}
        />
        <MainCard>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
          </Stack>
        </MainCard>
      </Box>
    );
  }

  // Helper for error state
  const getErrorInfo = (error) => {
    // Default error info
    return {
      icon: ErrorOutlineIcon,
      title: 'خطأ في التحميل',
      message: error?.message || 'حدث خطأ أثناء تحميل بيانات التصنيف'
    };
  };

  if (loadError || !categoryData) {
    const errorInfo = getErrorInfo(loadError);
    return (
      <Box>
        <ModernPageHeader
          title="تعديل تصنيف طبي"
          subtitle="تحديث بيانات التصنيف الطبي"
          icon={CategoryIcon}
          breadcrumbs={[{ label: 'التصنيفات الطبية', path: '/medical-categories' }, { label: 'تعديل' }]}
        />
        <MainCard>
          <ModernEmptyState
            icon={errorInfo.icon}
            title={errorInfo.title}
            description={errorInfo.message}
            action={<Button variant="outlined" onClick={handleBack}>رجوع للقائمة</Button>}
          />
        </MainCard>
      </Box>
    );
  }

  return (
    <Box>
      <ModernPageHeader
        title="تعديل تصنيف طبي"
        subtitle={`تحديث بيانات: ${categoryData.nameAr || categoryData.name}`}
        icon={CategoryIcon}
        breadcrumbs={[{ label: 'التصنيفات الطبية', path: '/medical-categories' }, { label: 'تعديل' }]}
        actions={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            إلغاء
          </Button>
        }
      />

      <MainCard>
        <Box component="form" onSubmit={handleSubmit}>
          {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}

          <Grid container spacing={3}>
            {/* Code (Read-Only) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الرمز"
                name="code"
                value={formData.code}
                disabled={true} // Immutable in Edit
                InputProps={{
                  startAdornment: <LockIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
                }}
              />
            </Grid>

            {/* Parent Category */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="التصنيف الأب (اختياري)"
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                disabled={isSubmitting || loadingParents}
                helperText={loadingParents ? 'جاري تحميل التصنيفات...' : ''}
              >
                <MenuItem value="">
                  <em>بدون أب (تصنيف رئيسي)</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nameAr || cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Arabic Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="الاسم (عربي)"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={isSubmitting}
                dir="rtl"
              />
            </Grid>

            {/* English Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="English Name"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleChange}
                error={!!formErrors.nameEn}
                helperText={formErrors.nameEn}
                disabled={isSubmitting}
                dir="ltr"
                inputProps={{ style: { textAlign: 'left' } }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleChange}
                    name="active"
                    color="primary"
                  />
                }
                label={formData.active ? 'نشط' : 'غير نشط'}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleBack} disabled={isSubmitting}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<SaveIcon />} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </MainCard>
    </Box>
  );
};

export default MedicalCategoryEdit;
