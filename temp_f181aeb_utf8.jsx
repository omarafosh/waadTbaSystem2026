/**
 * Unified Member View Page
 * 
 * Displays Principal member with expandable Dependents list.
 * Refactored to match UnifiedMemberCreate layout (Tabs).
 * 
 * @module UnifiedMemberView
 * @since 2026-01-11
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Avatar,
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Badge as BadgeIcon,
  ContactPhone as ContactPhoneIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Person as PersonIcon,
  QrCode as QrCodeIcon,
  CreditCard as CreditCardIcon,
  Cake as CakeIcon,
  Wc as WcIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { getMember, deleteMember, addDependent, MEMBER_TYPES, GENDERS, RELATIONSHIPS } from 'services/api/unified-members.service';
import { openSnackbar } from 'api/snackbar';
import { RBACGuard, MemberAvatar } from '../../components/tba';
import { PERMISSIONS } from 'constants/permissions.constants';

/**
 * Unified Member View Component
 */
const UnifiedMemberView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);

  // Inline Add Dependent State
  const [addingDependent, setAddingDependent] = useState(false);
  const [depErrors, setDepErrors] = useState({});
  const [newDependent, setNewDependent] = useState({
    fullName: '',
    nationalNumber: '',
    birthDate: null,
    gender: '',
    relationship: '',
    nationality: 'ليبي',
    maritalStatus: ''
  });

  useEffect(() => {
    if (id) {
      fetchMember();
    }
  }, [id]);

  const fetchMember = async () => {
    setLoading(true);
    try {
      const response = await getMember(id);
      setMember(response);
    } catch (error) {
      console.error('Error fetching member:', error);
      openSnackbar({
        open: true,
        message: 'خطأ في جلب بيانات المنتفع',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteConfirm = (memberToDelete) => {
    setDeletingMember(memberToDelete);
    setDeleteDialogOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!deletingMember) return;

    try {
      await deleteMember(deletingMember.id);

      const isPrincipal = deletingMember.type === MEMBER_TYPES.PRINCIPAL;

      openSnackbar({
        open: true,
        message: isPrincipal
          ? 'تم حذف المنتفع الرئيسي وجميع تابعيه بنجاح'
          : 'تم حذف المنتفع التابع بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });

      if (isPrincipal) {
        navigate('/members');
      } else {
        fetchMember();
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      openSnackbar({
        open: true,
        message: error.response?.data?.message || 'خطأ في حذف المنتفع',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingMember(null);
    }
  };

  // Inline Add Dependent Handlers
  const handleDepFieldChange = (field) => (event) => {
    const value = event.target.value;
    setNewDependent((prev) => ({ ...prev, [field]: value }));
    if (depErrors[field]) {
      setDepErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleDepDateChange = (field) => (date) => {
    setNewDependent((prev) => ({ ...prev, [field]: date }));
    if (depErrors[field]) {
      setDepErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateDepForm = () => {
    const newErrors = {};
    if (!newDependent.fullName.trim()) newErrors.fullName = 'الاسم مطلوب';
    if (!newDependent.birthDate) newErrors.birthDate = 'التاريخ مطلوب';
    if (!newDependent.gender) newErrors.gender = 'الجنس مطلوب';
    if (!newDependent.relationship) newErrors.relationship = 'القرابة مطلوبة';

    setDepErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDependentSubmit = async () => {
    if (!validateDepForm()) return;

    try {
      setAddingDependent(true);
      const payload = {
        fullName: newDependent.fullName.trim(),
        nationalNumber: newDependent.nationalNumber?.trim() || null,
        birthDate: newDependent.birthDate ? dayjs(newDependent.birthDate).format('YYYY-MM-DD') : null,
        gender: newDependent.gender,
        relationship: newDependent.relationship,
        nationality: newDependent.nationality || 'ليبي',
        maritalStatus: newDependent.maritalStatus || 'SINGLE' // Default to SINGLE if not specified
      };

      await addDependent(member.id, payload);

      openSnackbar({
        open: true,
        message: 'تم إضافة التابع بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });

      // Clear form and refresh
      setNewDependent({
        fullName: '',
        nationalNumber: '',
        birthDate: null,
        gender: '',
        relationship: '',
        nationality: 'ليبي',
        maritalStatus: ''
      });
      fetchMember();

    } catch (error) {
      console.error('Error adding dependent:', error);
      openSnackbar({
        open: true,
        message: error.response?.data?.message || 'خطأ في إضافة التابع',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setAddingDependent(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return (
      <Box>
        <Alert severity="error">لم يتم العثور على المنتفع</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/members')} sx={{ mt: 2 }}>
          رجوع للقائمة
        </Button>
      </Box>
    );
  }

  const isPrincipal = member.type === MEMBER_TYPES.PRINCIPAL;
  const dependents = member.dependents || [];

  return (
    <RBACGuard requiredPermissions={[PERMISSIONS.VIEW_MEMBERS]}>
      <ModernPageHeader
        title={member.fullName}
        subtitle={isPrincipal ? 'منتفع رئيسي (Principal)' : 'منتفع تابع (Dependent)'}
        icon={isPrincipal ? <BadgeIcon /> : <FamilyRestroomIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'المنتفعين', href: '/members' },
          { label: member.fullName }
        ]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/members')}>
              رجوع
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/members/${id}/edit`)}
            >
              تعديل
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteConfirm(member)}
            >
              حذف
            </Button>
          </Stack>
        }
      />

      <MainCard
        content={false}
        sx={{
          height: 'calc(100vh - 180px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="member tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: '13px',
                fontWeight: 500,
                color: 'text.secondary',
                transition: 'all 0.2s',
                px: 3,
                '&.Mui-selected': {
                  color: 'primary.main',
                  bgcolor: 'primary.lighter',
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab label="البيانات الشخصية" icon={<PersonIcon />} iconPosition="start" />
            {isPrincipal && <Tab label="بيانات العمل" icon={<BadgeIcon />} iconPosition="start" />}
            <Tab label="معلومات الاتصال" icon={<ContactPhoneIcon />} iconPosition="start" />
            {isPrincipal && <Tab label={`التابعون (${dependents.length})`} icon={<FamilyRestroomIcon />} iconPosition="start" />}
          </Tabs>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>

          {/* Tab 0: Personal Info */}
          <div role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                {/* Column 1 (Right in RTL): Photo & Status */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%', bgcolor: 'grey.50' }}>
                    <Stack alignItems="center" spacing={2} justifyContent="center" sx={{ height: '100%' }}>
                      <MemberAvatar member={member} size={140} />
                      <Stack direction="row" spacing={1} justifyContent="center" sx={{ width: '100%' }}>
                        <Chip
                          label={isPrincipal ? 'رئيسي' : 'تابع'}
                          color={isPrincipal ? 'primary' : 'secondary'}
                          size="small"
                        />
                        <Chip
                          label={member.status === 'ACTIVE' ? 'نشط' : member.status}
                          color={member.status === 'ACTIVE' ? 'success' : member.status === 'SUSPENDED' ? 'warning' : 'error'}
                          size="small"
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Column 2 (Center in RTL): Personal Details (Wider) */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center', py: 1 }}>
                    <Grid container spacing={3}>
                      {/* Row 1 */}
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>الاسم الكامل</Typography>
                          <Typography variant="h5" fontWeight="bold">{member.fullName}</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>الرقم الوطني</Typography>
                          <Typography variant="h6" fontFamily="monospace" sx={{ letterSpacing: 1 }}>{member.nationalNumber || '-'}</Typography>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12 }}><Divider /></Grid>

                      {/* Row 2 */}
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">تاريخ الميلاد</Typography>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <CakeIcon fontSize="small" color="action" />
                            <Typography variant="subtitle1" fontWeight="medium">{member.birthDate || '-'}</Typography>
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">الجنس</Typography>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <WcIcon fontSize="small" color="action" />
                            <Typography variant="subtitle1" fontWeight="medium">
                              {member.gender === GENDERS.MALE ? 'ذكر' : member.gender === GENDERS.FEMALE ? 'أنثى' : '-'}
                            </Typography>
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">الحالة الاجتماعية</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={
                                member.maritalStatus === 'SINGLE' ? 'أعزب' :
                                  member.maritalStatus === 'MARRIED' ? 'متزوج' :
                                    member.maritalStatus === 'DIVORCED' ? 'مطلق' :
                                      member.maritalStatus === 'WIDOWED' ? 'أرمل' :
                                        member.maritalStatus || 'غير محدد'
                              }
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">الجنسية</Typography>
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 0.5 }}>{member.nationality || '-'}</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Notes (if any) */}
                    {member.notes && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>ملاحظات</Typography>
                        <Typography variant="body2" sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
                          {member.notes}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>

                {/* Column 3 (Left in RTL): Cards */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack spacing={2} sx={{ height: '100%' }}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Stack spacing={1} alignItems="center" sx={{ width: '100%', textAlign: 'center' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CreditCardIcon color="secondary" />
                          <Typography variant="body2" color="text.secondary">رقم البطاقة</Typography>
                        </Stack>
                        <Chip
                          label={member.cardNumber || '-'}
                          variant="outlined"
                          color="secondary"
                          size="medium"
                          sx={{ fontWeight: 'bold', fontFamily: 'monospace', px: 1 }}
                        />
                      </Stack>
                    </Paper>

                    {isPrincipal && (
                      <Paper elevation={0} variant="outlined" sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: member.barcode ? 'primary.lighter' : 'transparent' }}>
                        <Stack spacing={1} alignItems="center" sx={{ width: '100%', textAlign: 'center' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <QrCodeIcon color="primary" />
                            <Typography variant="body2" color="text.secondary">Barcode</Typography>
                          </Stack>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">{member.barcode || '-'}</Typography>
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 1: Employment Info (Principal Only) */}
          <div role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && isPrincipal && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <BusinessIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">جهة العمل</Typography>
                      <Typography variant="subtitle1" fontWeight="medium">{member.employerName || '-'}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">البوليصة</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label={member.benefitPolicyName || 'لا يوجد'} color="primary" variant="outlined" size="small" />
                      {member.benefitPolicyCode && <Chip label={member.benefitPolicyCode} size="small" />}
                    </Stack>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">الرقم الوظيفي</Typography>
                    <Typography variant="subtitle1" fontFamily="monospace">{member.employeeNumber || '-'}</Typography>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">المهنة</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">{member.occupation || '-'}</Typography>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">تاريخ الالتحاق</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">{member.joinDate || '-'}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 2: Contact Info */}
          <div role="tabpanel" hidden={tabValue !== (isPrincipal ? 2 : 1)}>
            {(tabValue === (isPrincipal ? 2 : 1)) && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon color="action" />
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">رقم الهاتف</Typography>
                      <Typography variant="subtitle1" fontWeight="medium">{member.phone || '-'}</Typography>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailIcon color="action" />
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">البريد الإلكتروني</Typography>
                      <Typography variant="subtitle1" fontWeight="medium">{member.email || '-'}</Typography>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">العنوان</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{member.address || '-'}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 3: Dependents (Principal Only) */}
          <div role="tabpanel" hidden={tabValue !== 3}>
            {tabValue === 3 && isPrincipal && (
              <Stack spacing={3}>
                {/* Help Info */}
                <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                  <Typography variant="body2">
                    يمكنك إضافة التابعين الآن. التابعون لا يملكون Barcode خاص بهم.
                  </Typography>
                </Alert>

                {/* Inline Form */}
                <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 'bold' }}>إضافة تابع جديد</Typography>

                  <Grid container spacing={2} alignItems="flex-start">
                    {/* Full Name */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        label="الاسم الكامل"
                        value={newDependent.fullName}
                        onChange={handleDepFieldChange('fullName')}
                        error={!!depErrors.fullName}
                        helperText={depErrors.fullName}
                        size="small"
                        sx={{ minWidth: 220 }}
                      />
                    </Grid>

                    {/* Relationship */}
                    <Grid size={{ xs: 12, md: 2 }}>
                      <FormControl fullWidth required error={!!depErrors.relationship} size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>القرابة</InputLabel>
                        <Select
                          value={newDependent.relationship}
                          onChange={handleDepFieldChange('relationship')}
                          label="القرابة"
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
                        {depErrors.relationship && <FormHelperText>{depErrors.relationship}</FormHelperText>}
                      </FormControl>
                    </Grid>

                    {/* Gender */}
                    <Grid size={{ xs: 12, md: 2 }}>
                      <FormControl fullWidth required error={!!depErrors.gender} size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>الجنس</InputLabel>
                        <Select
                          value={newDependent.gender}
                          onChange={handleDepFieldChange('gender')}
                          label="الجنس"
                        >
                          {Object.entries(GENDERS).map(([key, value]) => (
                            <MenuItem key={key} value={value}>
                              {value === 'MALE' ? 'ذكر' : value === 'FEMALE' ? 'أنثى' : 'غير محدد'}
                            </MenuItem>
                          ))}
                        </Select>
                        {depErrors.gender && <FormHelperText>{depErrors.gender}</FormHelperText>}
                      </FormControl>
                    </Grid>

                    {/* Marital Status (Optional) */}
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>الحالة الاجتماعية</InputLabel>
                        <Select
                          value={newDependent.maritalStatus}
                          onChange={handleDepFieldChange('maritalStatus')}
                          label="الحالة الاجتماعية"
                        >
                          <MenuItem value=""><em>غير محدد</em></MenuItem>
                          <MenuItem value="SINGLE">أعزب</MenuItem>
                          <MenuItem value="MARRIED">متزوج</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Nationality (Default Libyan) */}
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="الجنسية"
                        value={newDependent.nationality}
                        onChange={handleDepFieldChange('nationality')}
                        size="small"
                        sx={{ minWidth: 120 }}
                      />
                    </Grid>

                    {/* Birth Date */}
                    <Grid item xs={12} md={2}>
                      <DatePicker
                        label="تاريخ الميلاد *"
                        value={newDependent.birthDate}
                        onChange={handleDepDateChange('birthDate')}
                        maxDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            error: !!depErrors.birthDate,
                            helperText: depErrors.birthDate,
                            sx: { minWidth: 150 }
                          }
                        }}
                      />
                    </Grid>

                    {/* National ID */}
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="الرقم الوطني"
                        value={newDependent.nationalNumber}
                        onChange={handleDepFieldChange('nationalNumber')}
                        placeholder="اختياري"
                        size="small"
                        sx={{ minWidth: 150 }}
                      />
                    </Grid>

                    {/* Action Button */}
                    <Grid item xs={12} md={12} sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={addingDependent ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                          onClick={handleAddDependentSubmit}
                          disabled={addingDependent}
                          sx={{ height: 40, px: 4 }}
                        >
                          إضافة التابع
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                <Divider />

                {/* Dependents List */}
                <Box>
                  {dependents.length === 0 ? (
                    <Typography variant="body2" align="center" color="text.secondary" sx={{ py: 3 }}>
                      لا يوجد تابعين مسجلين حالياً.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>الاسم</TableCell>
                            <TableCell>القرابة</TableCell>
                            <TableCell>رقم البطاقة</TableCell>
                            <TableCell>الجنس</TableCell>
                            <TableCell>تاريخ الميلاد</TableCell>
                            <TableCell>الحالة</TableCell>
                            <TableCell align="center">إجراءات</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dependents.map((dep, index) => (
                            <TableRow key={dep.id} hover>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">{dep.fullName}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={dep.relationship} size="small" variant="outlined" color="primary" />
                              </TableCell>
                              <TableCell>{dep.cardNumber || '-'}</TableCell>
                              <TableCell>
                                {dep.gender === GENDERS.MALE ? 'ذكر' : dep.gender === GENDERS.FEMALE ? 'أنثى' : '-'}
                              </TableCell>
                              <TableCell>{dep.birthDate || '-'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={dep.status === 'ACTIVE' ? 'نشط' : dep.status}
                                  color={dep.status === 'ACTIVE' ? 'success' : 'default'}
                                  size="small"
                                  sx={{ height: 24 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="عرض التفاصيل">
                                    <IconButton size="small" color="primary" onClick={() => navigate(`/members/${dep.id}`)}>
                                      <BadgeIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="تعديل">
                                    <IconButton size="small" color="secondary" onClick={() => navigate(`/members/${dep.id}/edit`)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="حذف">
                                    <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(dep)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Stack>
            )}
          </div>
        </Box>
      </MainCard>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deletingMember?.type === MEMBER_TYPES.PRINCIPAL ? (
              <>
                هل أنت متأكد من حذف المنتفع الرئيسي <strong>{deletingMember?.fullName}</strong>؟
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <strong>تنبيه:</strong> سيتم حذف جميع التابعين ({member.dependentsCount || 0}) تلقائياً (CASCADE DELETE).
                </Alert>
              </>
            ) : (
              <>
                هل أنت متأكد من حذف التابع <strong>{deletingMember?.fullName}</strong>؟
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleDeleteExecute} color="error" variant="contained" autoFocus>
            تأكيد الحذف
          </Button>
        </DialogActions>
      </Dialog>
    </RBACGuard>
  );
};

export default UnifiedMemberView;
