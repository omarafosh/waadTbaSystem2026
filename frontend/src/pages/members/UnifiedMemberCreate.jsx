/**
 * Unified Member Create Page
 * 
 * Creates a Principal member with optional inline Dependents.
 * Uses new Unified Architecture (single Member entity with parent_id).
 * 
 * Architecture:
 * - Principal: parent_id = NULL, has Barcode (auto-generated)
 * - Dependent: parent_id references Principal, NO Barcode
 * - Card Numbers: Principal (NNNNNN), Dependent (NNNNNN-NN)
 * 
 * @module UnifiedMemberCreate
 * @since 2026-01-11
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PeopleAlt as PeopleAltIcon,
  ExpandMore as ExpandMoreIcon,
  PersonAdd as PersonAddIcon,
  Badge as BadgeIcon,
  ContactPhone as ContactPhoneIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { createPrincipalMember, RELATIONSHIPS, GENDERS } from 'services/api/unified-members.service';
import axiosClient from 'utils/axios';
import { openSnackbar } from 'api/snackbar';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

/**
 * Unified Member Create Component
 */
const UnifiedMemberCreate = () => {
  const navigate = useNavigate();

  // Tab State
  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Common Styles for 12px font consistency and Uniform Height
  const commonInputStyles = {
    // Fonts
    '& .MuiInputBase-root': { fontSize: '12px' },
    '& .MuiInputLabel-root': { fontSize: '12px' },
    '& .MuiMenuItem-root': { fontSize: '12px' },
    '& .MuiTypography-root': { fontSize: '12px' },
    '& .MuiButton-root': { 
        fontSize: '12px',
        height: '40px' // Match input height
    },
    
    // Uniform Height (40px standard)
    '& .MuiFormControl-root': {
        minWidth: '200px', // Prevent shrinking (Fix for "منكمشة")
        width: '100%'
    },
    '& .MuiOutlinedInput-root': {
        height: '40px',
    },
    // Fix Input alignment within 40px container
    '& .MuiInputBase-input': {
        height: '40px',
        padding: '0 14px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center'
    },
    // Specific Fix for Select Component to center content
    '& .MuiSelect-select': {
        height: '40px !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important',
        display: 'flex',
        alignItems: 'center'
    },
    // Adjust Label Position for shorter height (center it)
    '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
        transform: 'translate(14px, 9px) scale(1)'
    }
  };

  const menuProps = {
    PaperProps: {
      sx: {
        '& .MuiMenuItem-root': { fontSize: '12px' },
        maxHeight: 300,
        minWidth: 200 // Added for better visibility of long options
      }
    }
  };

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Principal Member Form (aligned with MemberCreateDto)
  const [principalForm, setPrincipalForm] = useState({
    fullName: '',
    nationalNumber: '', // Optional - Civil ID optional as per architecture
    birthDate: null,
    gender: '',
    maritalStatus: '',
    nationality: '',
    phone: '',
    email: '',
    address: '',
    employerOrganizationId: '',
    benefitPolicyId: '',
    employeeNumber: '',
    joinDate: null,
    occupation: '',
    policyNumber: '',
    status: 'ACTIVE',
    startDate: dayjs(),
    endDate: null,
    notes: ''
  });

  // Dependents Array (inline creation)
  const [dependents, setDependents] = useState([]);

  // Dependent Draft (for adding new dependent)
  const [dependentDraft, setDependentDraft] = useState({
    relationship: '',
    fullName: '',
    nationalNumber: '', // Optional
    birthDate: null,
    gender: ''
  });

  // Calculate allowed relationships based on Principal logic
  // If Single -> No Spouse, No Children
  // If Married -> Spouse (Gender restricted) + Children
  const getRelationshipOptions = () => {
    const { maritalStatus, gender } = principalForm;
    
    // Base relations (always allowed)
    const options = [
      { value: RELATIONSHIPS.FATHER, label: 'أب' },
      { value: RELATIONSHIPS.MOTHER, label: 'أم' },
      { value: RELATIONSHIPS.BROTHER, label: 'أخ' },
      { value: RELATIONSHIPS.SISTER, label: 'أخت' },
    ];

    // Children (Allowed if not SINGLE)
    if (maritalStatus !== 'SINGLE') {
      options.push(
        { value: RELATIONSHIPS.SON, label: 'ابن' },
        { value: RELATIONSHIPS.DAUGHTER, label: 'ابنة' }
      );
    }

    // Spouse (Allowed if MARRIED)
    if (maritalStatus === 'MARRIED') {
      if (gender === GENDERS.MALE) {
        options.push({ value: RELATIONSHIPS.WIFE, label: 'زوجة' });
      } else if (gender === GENDERS.FEMALE) {
        options.push({ value: RELATIONSHIPS.HUSBAND, label: 'زوج' });
      } else {
        // Fallback if gender not selected yet
        options.push({ value: RELATIONSHIPS.WIFE, label: 'زوجة' });
        options.push({ value: RELATIONSHIPS.HUSBAND, label: 'زوج' });
      }
    }

    return options;
  };

  const relationshipOptions = getRelationshipOptions();

  // Lookup Data
  const [employers, setEmployers] = useState([]);
  const [benefitPolicies, setBenefitPolicies] = useState([]);

  // Fetch lookup data
  useEffect(() => {
    fetchEmployers();
    fetchBenefitPolicies();
  }, []);

  const fetchEmployers = async () => {
    try {
      // Use selectors endpoint for dropdown population - faster and lighter
      const response = await axiosClient.get('/employers/selectors');
      setEmployers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching employers:', error);
      openSnackbar({
        open: true,
        message: 'خطأ في جلب جهات العمل',
        variant: 'alert',
        alert: { color: 'error' }
      });
    }
  };

  const fetchBenefitPolicies = async () => {
    try {
      const response = await axiosClient.get('/benefit-policies', {
        params: { page: 0, size: 1000 }
      });
      setBenefitPolicies(response.data?.data?.content || []);
    } catch (error) {
      console.error('Error fetching benefit policies:', error);
    }
  };

  /**
   * Handle principal form change
   */
  const handlePrincipalChange = (field) => (eventOrValue) => {
    // Handle both event objects (from inputs) and direct values (from DatePicker)
    let value;
    if (eventOrValue === null || eventOrValue === undefined) {
      value = null;
    } else if (eventOrValue?.target !== undefined) {
      value = eventOrValue.target.value;
    } else {
      value = eventOrValue; // Direct value from DatePicker
    }
    
    setPrincipalForm((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Handle dependent draft change
   */
  const handleDependentDraftChange = (field) => (eventOrValue) => {
    // Handle both event objects (from inputs) and direct values (from DatePicker)
    let value;
    if (eventOrValue === null || eventOrValue === undefined) {
      value = null;
    } else if (eventOrValue?.target !== undefined) {
      value = eventOrValue.target.value;
    } else {
      value = eventOrValue; // Direct value from DatePicker
    }
    
    setDependentDraft((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Add dependent to list
   */
  const handleAddDependent = () => {
    // Validation
    const depErrors = {};
    if (!dependentDraft.relationship) depErrors.relationship = 'القرابة مطلوبة';
    if (!dependentDraft.fullName?.trim()) depErrors.fullName = 'الاسم الكامل مطلوب';
    if (!dependentDraft.birthDate) depErrors.birthDate = 'تاريخ الميلاد مطلوب';
    if (!dependentDraft.gender) depErrors.gender = 'الجنس مطلوب';

    if (Object.keys(depErrors).length > 0) {
      setErrors(depErrors);
      return;
    }

    // Add to dependents array
    const newDependent = {
      ...dependentDraft,
      birthDate: dependentDraft.birthDate ? dayjs(dependentDraft.birthDate).format('YYYY-MM-DD') : null,
      tempId: Date.now() // Temporary ID for UI tracking
    };

    setDependents((prev) => [...prev, newDependent]);

    // Reset draft
    setDependentDraft({
      relationship: '',
      fullName: '',
      nationalNumber: '',
      birthDate: null,
      gender: ''
    });

    setErrors({});

    openSnackbar({
      open: true,
      message: 'تم إضافة التابع بنجاح',
      variant: 'alert',
      alert: { color: 'success' }
    });
  };

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dependentToDelete, setDependentToDelete] = useState(null);

  /**
   * Request to remove dependent (opens confirmation)
   */
  const handleRequestRemoveDependent = (dep) => {
    setDependentToDelete(dep);
    setDeleteDialogOpen(true);
  };

  /**
   * Confirm removal of dependent
   */
  const handleConfirmRemoveDependent = () => {
    if (dependentToDelete) {
        setDependents((prev) => prev.filter((dep) => dep.tempId !== dependentToDelete.tempId));
        openSnackbar({
          open: true,
          message: 'تم حذف التابع',
          variant: 'alert',
          alert: { color: 'info' }
        });
    }
    setDeleteDialogOpen(false);
    setDependentToDelete(null);
  };

  /**
   * Cancel removal
   */
  const handleCancelRemoveDependent = () => {
    setDeleteDialogOpen(false);
    setDependentToDelete(null);
  };

  /**
   * Validate principal form
   */
  const validatePrincipalForm = () => {
    const newErrors = {};

    // Required fields
    if (!principalForm.fullName?.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
    if (!principalForm.birthDate) newErrors.birthDate = 'تاريخ الميلاد مطلوب';
    if (!principalForm.gender) newErrors.gender = 'الجنس مطلوب';
    if (!principalForm.employerOrganizationId) newErrors.employerOrganizationId = 'جهة العمل مطلوبة';

    // Optional validations
    if (principalForm.email && !principalForm.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submit form - Create Principal with Dependents
   */
  const handleSubmit = async () => {
    // Validate
    if (!validatePrincipalForm()) {
      openSnackbar({
        open: true,
        message: 'يرجى تصحيح الأخطاء في النموذج',
        variant: 'alert',
        alert: { color: 'error' }
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare payload
      const payload = {
        // Principal data
        fullName: principalForm.fullName.trim(),
        nationalNumber: principalForm.nationalNumber?.trim() || null,
        birthDate: principalForm.birthDate ? dayjs(principalForm.birthDate).format('YYYY-MM-DD') : null,
        gender: principalForm.gender || 'UNDEFINED',  // Default to UNDEFINED if not selected
        maritalStatus: principalForm.maritalStatus || null,
        nationality: principalForm.nationality || null,
        phone: principalForm.phone || null,
        email: principalForm.email || null,
        address: principalForm.address || null,
        employerId: principalForm.employerOrganizationId,  // ✅ FIXED: Send as employerId
        benefitPolicyId: principalForm.benefitPolicyId || null,
        employeeNumber: principalForm.employeeNumber || null,
        joinDate: principalForm.joinDate ? dayjs(principalForm.joinDate).format('YYYY-MM-DD') : null,
        occupation: principalForm.occupation || null,
        policyNumber: principalForm.policyNumber || null,
        status: principalForm.status || 'ACTIVE',
        startDate: principalForm.startDate ? dayjs(principalForm.startDate).format('YYYY-MM-DD') : null,
        endDate: principalForm.endDate ? dayjs(principalForm.endDate).format('YYYY-MM-DD') : null,
        notes: principalForm.notes || null,

        // Dependents (inline creation)
        dependents: dependents.map((dep) => ({
          relationship: dep.relationship,
          fullName: dep.fullName.trim(),
          nationalNumber: dep.nationalNumber?.trim() || null,
          birthDate: dep.birthDate,
          gender: dep.gender
        }))
      };

      console.log('Creating principal member with payload:', payload);

      // Call API
      const response = await createPrincipalMember(payload);

      console.log('Member created successfully:', response);

      // ✅ FIXED: Response is already unwrapped by service (response.data in service)
      // Check if response has the member data
      const createdMember = response?.data || response;
      
      if (!createdMember?.id) {
        throw new Error('Invalid response: Missing member ID');
      }

      openSnackbar({
        open: true,
        message: `تم إنشاء العضو الأصيل بنجاح ${dependents.length > 0 ? `مع ${dependents.length} تابع` : ''}`,
        variant: 'alert',
        alert: { color: 'success' }
      });

      // Navigate to view page (use the actual ID from response)
      navigate(`/members/${createdMember.id}`);
    } catch (error) {
      console.error('Error creating member:', error);

      const errorMessage = error.response?.data?.message || error.message || 'خطأ في إنشاء العضو';

      openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RBACGuard requiredPermissions={[PERMISSIONS.MANAGE_MEMBERS]}>
      <ModernPageHeader
        title="إنشاء عضو أصيل جديد"
        icon={<PersonAddIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'الأعضاء', href: '/members' },
          { label: 'إنشاء عضو أصيل' }
        ]}
        actions={
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/members')}>
            رجوع
          </Button>
        }
      />

      <MainCard 
        title="بيانات العضو الأصيل" 
        content={false}
        sx={{
          height: 'calc(100vh - 180px)',
          display: 'flex',
          flexDirection: 'column',
          ...commonInputStyles
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="member tabs" 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{ minHeight: 48 }}
          >
            <Tab label="البيانات الشخصية" icon={<PersonIcon />} iconPosition="start" sx={{ fontSize: '12px', minHeight: 48 }} />
            <Tab label="بيانات العمل" icon={<BadgeIcon />} iconPosition="start" sx={{ fontSize: '12px', minHeight: 48 }} />
            <Tab label="معلومات الاتصال" icon={<ContactPhoneIcon />} iconPosition="start" sx={{ fontSize: '12px', minHeight: 48 }} />
            <Tab label={`التابعون (${dependents.length})`} icon={<FamilyRestroomIcon />} iconPosition="start" sx={{ fontSize: '12px', minHeight: 48 }} />
          </Tabs>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {/* Tab 0: Personal Info */}
          <div role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                   <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '12px' } }}>
                      يتم توليد رقم البطاقة والباركود تلقائياً عند الحفظ.
                   </Alert>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    fullWidth required label="الاسم الكامل" 
                    value={principalForm.fullName} 
                    onChange={handlePrincipalChange('fullName')} 
                    error={!!errors.fullName} 
                    helperText={errors.fullName}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    fullWidth label="الرقم المدني" 
                    value={principalForm.nationalNumber} 
                    onChange={handlePrincipalChange('nationalNumber')} 
                    helperText="اختياري"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DatePicker
                    label="تاريخ الميلاد *"
                    value={principalForm.birthDate}
                    onChange={handlePrincipalChange('birthDate')}
                    slotProps={{ textField: { fullWidth: true, required: true, error: !!errors.birthDate, helperText: errors.birthDate, size: "small" } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required error={!!errors.gender} size="small">
                    <InputLabel id="gender-label">الجنس</InputLabel>
                    <Select 
                      labelId="gender-label"
                      value={principalForm.gender} 
                      onChange={handlePrincipalChange('gender')} 
                      label="الجنس"
                      MenuProps={menuProps}
                    >
                      <MenuItem value=""><em>اختر...</em></MenuItem>
                      <MenuItem value={GENDERS.MALE}>ذكر</MenuItem>
                      <MenuItem value={GENDERS.FEMALE}>أنثى</MenuItem>
                    </Select>
                    {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="marital-label">الحالة الاجتماعية</InputLabel>
                    <Select 
                      labelId="marital-label"
                      value={principalForm.maritalStatus} 
                      onChange={handlePrincipalChange('maritalStatus')} 
                      label="الحالة الاجتماعية"
                      MenuProps={menuProps}
                    >
                      <MenuItem value=""><em>غير محدد</em></MenuItem>
                      <MenuItem value="SINGLE">أعزب</MenuItem>
                      <MenuItem value="MARRIED">متزوج</MenuItem>
                      <MenuItem value="DIVORCED">مطلق</MenuItem>
                      <MenuItem value="WIDOWED">أرمل</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="الجنسية" value={principalForm.nationality} onChange={handlePrincipalChange('nationality')} size="small" />
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 1: Employment Info */}
          <div role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required error={!!errors.employerOrganizationId} size="small">
                    <InputLabel id="employer-label">جهة العمل</InputLabel>
                    <Select 
                      labelId="employer-label"
                      value={principalForm.employerOrganizationId} 
                      onChange={handlePrincipalChange('employerOrganizationId')} 
                      label="جهة العمل"
                      MenuProps={menuProps}
                    >
                      <MenuItem value=""><em>اختر جهة العمل...</em></MenuItem>
                      {employers.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>{emp.label}</MenuItem>
                      ))}
                    </Select>
                    {errors.employerOrganizationId && <FormHelperText>{errors.employerOrganizationId}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="policy-label">البوليصة</InputLabel>
                    <Select 
                      labelId="policy-label"
                      value={principalForm.benefitPolicyId} 
                      onChange={handlePrincipalChange('benefitPolicyId')} 
                      label="البوليصة"
                      MenuProps={menuProps}
                    >
                      <MenuItem value=""><em>بدون بوليصة</em></MenuItem>
                      {benefitPolicies.map((policy) => (
                        <MenuItem key={policy.id} value={policy.id}>{policy.name} ({policy.policyCode})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="رقم الموظف" value={principalForm.employeeNumber} onChange={handlePrincipalChange('employeeNumber')} size="small" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DatePicker
                    label="تاريخ الالتحاق"
                    value={principalForm.joinDate}
                    onChange={handlePrincipalChange('joinDate')}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="المهنة" value={principalForm.occupation} onChange={handlePrincipalChange('occupation')} size="small" />
                </Grid>
                
                <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /></Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="تاريخ البداية"
                    value={principalForm.startDate}
                    onChange={handlePrincipalChange('startDate')}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="تاريخ النهاية"
                    value={principalForm.endDate}
                    onChange={handlePrincipalChange('endDate')}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="ملاحظات" value={principalForm.notes} onChange={handlePrincipalChange('notes')} multiline rows={3} size="small" />
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 2: Contact Info */}
          <div role="tabpanel" hidden={tabValue !== 2}>
             {tabValue === 2 && (
                <Grid container spacing={2}>
                   <Grid size={{ xs: 12, md: 6 }}>
                     <TextField fullWidth label="رقم الهاتف" value={principalForm.phone} onChange={handlePrincipalChange('phone')} size="small" />
                   </Grid>
                   <Grid size={{ xs: 12, md: 6 }}>
                     <TextField fullWidth label="البريد الإلكتروني" type="email" value={principalForm.email} onChange={handlePrincipalChange('email')} error={!!errors.email} helperText={errors.email} size="small" />
                   </Grid>
                   <Grid size={{ xs: 12 }}>
                     <TextField fullWidth label="العنوان" value={principalForm.address} onChange={handlePrincipalChange('address')} multiline rows={2} size="small" />
                   </Grid>
                </Grid>
             )}
          </div>

          {/* Tab 3: Dependents */}
          <div role="tabpanel" hidden={tabValue !== 3}>
             {tabValue === 3 && (
               <Box>
                   <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '12px' } }}>
                    يمكنك إضافة التابعين الآن أو لاحقاً. التابعون لا يملكون Barcode خاص بهم.
                   </Alert>
                   <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>إضافة تابع جديد</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required error={!!errors.relationship} size="small">
                          <InputLabel id="rel-label">القرابة</InputLabel>
                          <Select 
                            labelId="rel-label"
                            value={dependentDraft.relationship} 
                            onChange={handleDependentDraftChange('relationship')} 
                            label="القرابة"
                            MenuProps={menuProps}
                          >
                            <MenuItem value=""><em>اختر...</em></MenuItem>
                            {relationshipOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                         <TextField fullWidth required label="الاسم الكامل" value={dependentDraft.fullName} onChange={handleDependentDraftChange('fullName')} size="small" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                         <TextField fullWidth label="الرقم المدني" value={dependentDraft.nationalNumber} onChange={handleDependentDraftChange('nationalNumber')} size="small" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DatePicker label="تاريخ الميلاد *" value={dependentDraft.birthDate} onChange={handleDependentDraftChange('birthDate')} slotProps={{ textField: { fullWidth: true, required: true, size: "small" } }} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required error={!!errors.gender} size="small">
                           <InputLabel id="dep-gender-label">الجنس</InputLabel>
                           <Select 
                            labelId="dep-gender-label"
                            value={dependentDraft.gender} 
                            onChange={handleDependentDraftChange('gender')} 
                            label="الجنس"
                            MenuProps={menuProps}
                           >
                             <MenuItem value={GENDERS.MALE}>ذكر</MenuItem>
                             <MenuItem value={GENDERS.FEMALE}>أنثى</MenuItem>
                           </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddDependent}>إضافة التابع</Button>
                      </Grid>
                    </Grid>
                   </Paper>

                   {dependents.length > 0 && (
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>القرابة</TableCell>
                            <TableCell>الاسم</TableCell>
                            <TableCell>تاريخ الميلاد</TableCell>
                            <TableCell>الجنس</TableCell>
                            <TableCell>إجراءات</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                        {dependents.map((dep, index) => {
                            const relLabel = {
                                [RELATIONSHIPS.WIFE]: 'زوجة',
                                [RELATIONSHIPS.HUSBAND]: 'زوج',
                                [RELATIONSHIPS.SON]: 'ابن',
                                [RELATIONSHIPS.DAUGHTER]: 'ابنة',
                                [RELATIONSHIPS.FATHER]: 'أب',
                                [RELATIONSHIPS.MOTHER]: 'أم',
                                [RELATIONSHIPS.BROTHER]: 'أخ',
                                [RELATIONSHIPS.SISTER]: 'أخت'
                            }[dep.relationship] || dep.relationship;

                            return (
                              <TableRow key={dep.tempId}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={relLabel} 
                                        size="small" 
                                        color="primary" // Identity Color
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </TableCell>
                                <TableCell>{dep.fullName}</TableCell>
                                <TableCell>{dep.birthDate || '-'}</TableCell>
                                <TableCell>{dep.gender === GENDERS.MALE ? 'ذكر' : 'أنثى'}</TableCell>
                                <TableCell>
                                  <IconButton color="error" size="small" onClick={() => handleRequestRemoveDependent(dep)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                        })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                   )}
               </Box>
             )}
          </div>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'background.default' }}>
            <Button variant="outlined" onClick={() => navigate('/members')}>إلغاء</Button>
            <Button 
                variant="contained" 
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
                onClick={handleSubmit} 
                disabled={loading}
            >
                {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
        </Box>
      </MainCard>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelRemoveDependent}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{ sx: { minWidth: 400 } }}
      >
        <DialogTitle id="alert-dialog-title">
          {"تأكيد الحذف"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            هل أنت متأكد من رغبتك في حذف التابع <strong>{dependentToDelete?.fullName}</strong>؟
            <br />
            سيتم إزالة هذا التابع من القائمة الحالية (المسودة).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemoveDependent} color="inherit">إلغاء</Button>
          <Button onClick={handleConfirmRemoveDependent} color="error" autoFocus variant="contained">
            تأكيد الحذف
          </Button>
        </DialogActions>
      </Dialog>
    </RBACGuard>
  );
};

export default UnifiedMemberCreate;