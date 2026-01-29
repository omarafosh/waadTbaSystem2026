/**
 * Unified Member Edit Page
 * 
 * Edits a Principal or Dependent member.
 * Uses new Unified Architecture (single Member entity with parent_id).
 * 
 * @module UnifiedMemberEdit
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
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  FamilyRestroom as FamilyRestroomIcon,
  ContactPhone as ContactPhoneIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { getMember, updateMember, RELATIONSHIPS, GENDERS } from 'services/api/unified-members.service';
import axiosClient from 'utils/axios';
import { openSnackbar } from 'api/snackbar';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

/**
 * Unified Member Edit Component
 */
const UnifiedMemberEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState(null);

  // Member Type (PRINCIPAL or DEPENDENT)
  const [memberType, setMemberType] = useState(null);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    nationalNumber: '',
    birthDate: null,
    gender: '',
    maritalStatus: '',
    nationality: '',
    phone: '',
    email: '',
    address: '',
    relationship: '',
    employeeNumber: '',
    joinDate: null,
    occupation: '',
    policyNumber: '',
    status: 'ACTIVE',
    startDate: null,
    endDate: null,
    notes: ''
  });

  // Organizations & Benefit Policies
  const [organizations, setOrganizations] = useState([]);
  const [benefitPolicies, setBenefitPolicies] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [selectedBenefitPolicy, setSelectedBenefitPolicy] = useState('');

  // Fetch member data
  useEffect(() => {
    fetchMemberData();
    fetchDropdownData();
  }, [id]);

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      const data = await getMember(id);

      setMemberType(data.type);
      setForm({
        fullName: data.fullName || '',
        nationalNumber: data.nationalNumber || '',
        birthDate: data.birthDate ? dayjs(data.birthDate) : null,
        gender: data.gender || '',
        maritalStatus: data.maritalStatus || '',
        nationality: data.nationality || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        relationship: data.relationship || '',
        employeeNumber: data.employeeNumber || '',
        joinDate: data.joinDate ? dayjs(data.joinDate) : null,
        occupation: data.occupation || '',
        policyNumber: data.policyNumber || '',
        status: data.status || 'ACTIVE',
        startDate: data.startDate ? dayjs(data.startDate) : null,
        endDate: data.endDate ? dayjs(data.endDate) : null,
        notes: data.notes || ''
      });

      setSelectedOrganization(data.employerId || data.employer?.id || '');
      setSelectedBenefitPolicy(data.benefitPolicyId || data.benefitPolicy?.id || '');

    } catch (error) {
      console.error('Error fetching member:', error);
      setFetchError(error.response?.data?.message || 'فشل في تحميل بيانات المنتفع');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [orgsRes, policiesRes] = await Promise.all([
        axiosClient.get('/organizations', { params: { size: 1000 } }),
        axiosClient.get('/benefit-policies', { params: { size: 1000 } })
      ]);

      setOrganizations(orgsRes.data?.content || orgsRes.data || []);
      setBenefitPolicies(policiesRes.data?.content || policiesRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
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

    // Dependent requires relationship
    if (memberType === 'DEPENDENT' && !form.relationship) {
      newErrors.relationship = 'صلة القرابة مطلوبة للتابع';
    }

    // Principal requires organization
    if (memberType === 'PRINCIPAL' && !selectedOrganization) {
      newErrors.organization = 'جهة العمل مطلوبة';
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
        gender: form.gender || 'UNDEFINED',
        maritalStatus: form.maritalStatus || null,
        nationality: form.nationality || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        employeeNumber: form.employeeNumber || null,
        joinDate: form.joinDate ? dayjs(form.joinDate).format('YYYY-MM-DD') : null,
        occupation: form.occupation || null,
        policyNumber: form.policyNumber || null,
        status: form.status || 'ACTIVE',
        startDate: form.startDate ? dayjs(form.startDate).format('YYYY-MM-DD') : null,
        endDate: form.endDate ? dayjs(form.endDate).format('YYYY-MM-DD') : null,
        notes: form.notes || null
      };

      // Add type-specific fields
      if (memberType === 'PRINCIPAL') {
        payload.employerId = selectedOrganization || null;
        payload.benefitPolicyId = selectedBenefitPolicy || null;
      } else {
        payload.relationship = form.relationship || null;
      }

      console.log('Updating member with payload:', payload);

      await updateMember(id, payload);

      openSnackbar({
        open: true,
        message: 'تم تحديث بيانات المنتفع بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });

      navigate(`/members/${id}`);
    } catch (error) {
      console.error('Error updating member:', error);

      const errorMessage = error.response?.data?.message || error.message || 'خطأ في تحديث بيانات المنتفع';

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

  // Tab State
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const isPrincipal = memberType === 'PRINCIPAL';

  return (
    <RBACGuard requiredPermissions={[PERMISSIONS.MANAGE_MEMBERS]}>
      <ModernPageHeader
        title={`تعديل بيانات ${isPrincipal ? 'المنتفع الرئيسي' : 'المنتفع التابع'}`}
        subtitle={form.fullName}
        icon={<EditIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'المنتفعين', href: '/members' },
          { label: 'تعديل' }
        ]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/members')}
            >
              إلغاء
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              حفظ التعديلات
            </Button>
          </Stack>
        }
      />

      <MainCard content={false} sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, minHeight: 56 }}
          >
            <Tab icon={<PersonIcon />} iconPosition="start" label="البيانات الشخصية" />
            <Tab icon={isPrincipal ? <BadgeIcon /> : <FamilyRestroomIcon />} iconPosition="start" label={isPrincipal ? "بيانات العمل" : "صلة القرابة"} />
            <Tab icon={<ContactPhoneIcon />} iconPosition="start" label="معلومات الاتصال" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="الحالة والتواريخ" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Personal Info */}
          <div role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="الاسم الكامل"
                    value={form.fullName}
                    onChange={handleFieldChange('fullName')}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الرقم الوطني"
                    value={form.nationalNumber}
                    onChange={handleFieldChange('nationalNumber')}
                    placeholder="اختياري"
                    size="small"
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
                        size: 'small',
                        error: !!errors.birthDate,
                        helperText: errors.birthDate
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required error={!!errors.gender} size="small">
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
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="الجنسية"
                    value={form.nationality}
                    onChange={handleFieldChange('nationality')}
                    size="small"
                  />
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 1: Employment OR Relationship */}
          <div role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && (
              <Grid container spacing={3}>
                {isPrincipal ? (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required error={!!errors.organization} size="small">
                        <InputLabel>جهة العمل</InputLabel>
                        <Select
                          value={selectedOrganization}
                          onChange={(e) => setSelectedOrganization(e.target.value)}
                          label="جهة العمل"
                        >
                          {organizations.map((org) => (
                            <MenuItem key={org.id} value={org.id}>
                              {org.nameAr || org.nameEn || org.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.organization && <FormHelperText>{errors.organization}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>سياسة المنافع</InputLabel>
                        <Select
                          value={selectedBenefitPolicy}
                          onChange={(e) => setSelectedBenefitPolicy(e.target.value)}
                          label="سياسة المنافع"
                        >
                          <MenuItem value="">
                            <em>-- اختياري --</em>
                          </MenuItem>
                          {benefitPolicies.map((policy) => (
                            <MenuItem key={policy.id} value={policy.id}>
                              {policy.nameAr || policy.nameEn || policy.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="الرقم الوظيفي"
                        value={form.employeeNumber}
                        onChange={handleFieldChange('employeeNumber')}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DatePicker
                        label="تاريخ الالتحاق"
                        value={form.joinDate}
                        onChange={handleDateChange('joinDate')}
                        slotProps={{
                          textField: { fullWidth: true, size: "small" }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="المهنة"
                        value={form.occupation}
                        onChange={handleFieldChange('occupation')}
                        size="small"
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required error={!!errors.relationship} size="small">
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
                )}
              </Grid>
            )}
          </div>

          {/* Tab 2: Contact Info */}
          <div role="tabpanel" hidden={tabValue !== 2}>
            {tabValue === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="رقم الهاتف"
                    value={form.phone}
                    onChange={handleFieldChange('phone')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="البريد الإلكتروني"
                    type="email"
                    value={form.email}
                    onChange={handleFieldChange('email')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="العنوان"
                    value={form.address}
                    onChange={handleFieldChange('address')}
                    size="small"
                  />
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 3: Status & Dates */}
          <div role="tabpanel" hidden={tabValue !== 3}>
            {tabValue === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>الحالة</InputLabel>
                    <Select
                      value={form.status}
                      onChange={handleFieldChange('status')}
                      label="الحالة"
                    >
                      <MenuItem value="ACTIVE">نشط</MenuItem>
                      <MenuItem value="SUSPENDED">معلق</MenuItem>
                      <MenuItem value="TERMINATED">منتهي</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="تاريخ البدء"
                    value={form.startDate}
                    onChange={handleDateChange('startDate')}
                    slotProps={{
                      textField: { fullWidth: true, size: "small" }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="تاريخ الانتهاء"
                    value={form.endDate}
                    onChange={handleDateChange('endDate')}
                    slotProps={{
                      textField: { fullWidth: true, size: "small" }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="ملاحظات"
                    value={form.notes}
                    onChange={handleFieldChange('notes')}
                  />
                </Grid>
              </Grid>
            )}
          </div>
        </Box>
      </MainCard>
    </RBACGuard>
  );
};

export default UnifiedMemberEdit;
