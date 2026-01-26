/**
 * Add Dependent Page
 * 
 * Adds a new Dependent to an existing Principal member.
 * Uses new Unified Architecture (single Member entity with parent_id).
 * 
 * @module AddDependent
 * @since 2026-01-12
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
  Box,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { getMember, addDependent, RELATIONSHIPS, GENDERS } from 'services/api/unified-members.service';
import { openSnackbar } from 'api/snackbar';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

/**
 * Add Dependent Component
 */
const AddDependent = () => {
  const navigate = useNavigate();
  const { id: principalId } = useParams();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState(null);

  // Principal Member Info
  const [principal, setPrincipal] = useState(null);

  // Dependent Form
  const [form, setForm] = useState({
    fullName: '',
    nationalNumber: '',
    birthDate: null,
    gender: '',
    relationship: ''
  });

  // Fetch principal data
  useEffect(() => {
    fetchPrincipalData();
  }, [principalId]);

  const fetchPrincipalData = async () => {
    try {
      setLoading(true);
      const data = await getMember(principalId);
      
      if (data.type !== 'PRINCIPAL') {
        setFetchError('يمكن إضافة تابع فقط للعضو الأصيل');
        return;
      }
      
      setPrincipal(data);
    } catch (error) {
      console.error('Error fetching principal:', error);
      setFetchError(error.response?.data?.message || 'فشل في تحميل بيانات العضو الأصيل');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle date changes
  const handleDateChange = (field) => (date) => {
    setForm((prev) => ({ ...prev, [field]: date }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }

    if (!form.birthDate) {
      newErrors.birthDate = 'تاريخ الميلاد مطلوب';
    }

    if (!form.gender) {
      newErrors.gender = 'الجنس مطلوب';
    }

    if (!form.relationship) {
      newErrors.relationship = 'صلة القرابة مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      openSnackbar({
        open: true,
        message: 'يرجى تصحيح الأخطاء في النموذج',
        variant: 'alert',
        alert: { color: 'error' }
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        fullName: form.fullName.trim(),
        nationalNumber: form.nationalNumber?.trim() || null,
        birthDate: form.birthDate ? dayjs(form.birthDate).format('YYYY-MM-DD') : null,
        gender: form.gender,
        relationship: form.relationship
      };

      console.log('Adding dependent with payload:', payload);

      await addDependent(principalId, payload);

      openSnackbar({
        open: true,
        message: 'تمت إضافة التابع بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });

      navigate(`/members/${principalId}`);
    } catch (error) {
      console.error('Error adding dependent:', error);

      const errorMessage = error.response?.data?.message || error.message || 'خطأ في إضافة التابع';

      openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <MainCard>
        <Alert severity="error" sx={{ mb: 2 }}>
          {fetchError}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/members')}>
          العودة للقائمة
        </Button>
      </MainCard>
    );
  }

  return (
    <RBACGuard requiredPermissions={[PERMISSIONS.MANAGE_MEMBERS]}>
      <ModernPageHeader
        title="إضافة تابع جديد"
        subtitle={`إضافة تابع للعضو الأصيل: ${principal?.fullName}`}
        icon={<PersonAddIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'الأعضاء', href: '/members' },
          { label: principal?.fullName, href: `/members/${principalId}` },
          { label: 'إضافة تابع' }
        ]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/members/${principalId}`)}
            >
              إلغاء
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              إضافة التابع
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        {/* Principal Info Card */}
        <Grid item xs={12}>
          <MainCard>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1">
                <strong>العضو الأصيل:</strong> {principal?.fullName}
              </Typography>
              <Chip label={principal?.cardNumber} size="small" color="primary" />
              {principal?.barcode && (
                <Chip label={principal.barcode} size="small" variant="outlined" />
              )}
              <Chip 
                label={`${principal?.dependents?.length || 0} تابع حالياً`} 
                size="small" 
                color="info" 
              />
            </Stack>
          </MainCard>
        </Grid>

        {/* Dependent Form */}
        <Grid item xs={12}>
          <MainCard title="بيانات التابع">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="الاسم الكامل"
                  value={form.fullName}
                  onChange={handleFieldChange('fullName')}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.relationship}>
                  <InputLabel>صلة القرابة</InputLabel>
                  <Select
                    value={form.relationship}
                    onChange={handleFieldChange('relationship')}
                    label="صلة القرابة"
                  >
                    {Object.entries(RELATIONSHIPS).map(([key, value]) => (
                      <MenuItem key={key} value={value}>
                        {value === 'WIFE' ? 'زوجة' :
                         value === 'HUSBAND' ? 'زوج' :
                         value === 'SON' ? 'ابن' :
                         value === 'DAUGHTER' ? 'ابنة' :
                         value === 'FATHER' ? 'أب' :
                         value === 'MOTHER' ? 'أم' :
                         value === 'BROTHER' ? 'أخ' :
                         value === 'SISTER' ? 'أخت' : value}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.relationship && <FormHelperText>{errors.relationship}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="الرقم الوطني"
                  value={form.nationalNumber}
                  onChange={handleFieldChange('nationalNumber')}
                  placeholder="اختياري"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="تاريخ الميلاد *"
                  value={form.birthDate}
                  onChange={handleDateChange('birthDate')}
                  maxDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.birthDate,
                      helperText: errors.birthDate
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.gender}>
                  <InputLabel>الجنس</InputLabel>
                  <Select
                    value={form.gender}
                    onChange={handleFieldChange('gender')}
                    label="الجنس"
                  >
                    {Object.entries(GENDERS).map(([key, value]) => (
                      <MenuItem key={key} value={value}>
                        {value === 'MALE' ? 'ذكر' : value === 'FEMALE' ? 'أنثى' : 'غير محدد'}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>

        {/* Help Info */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>ملاحظة:</strong> سيتم توليد رقم البطاقة للتابع تلقائياً بناءً على رقم بطاقة العضو الأصيل 
              (مثال: إذا كان رقم الأصيل 000123، سيكون رقم التابع 000123-01، 000123-02، الخ)
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </RBACGuard>
  );
};

export default AddDependent;
