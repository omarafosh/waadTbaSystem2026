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
  FormHelperText,
  useTheme
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
  Business as BusinessIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TablePagination } from '@mui/material';
import dayjs from 'dayjs';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { getMember, deleteMember, addDependent, uploadPhoto, MEMBER_TYPES, GENDERS, RELATIONSHIPS } from 'services/api/unified-members.service';
import { openSnackbar } from 'api/snackbar';
import { RBACGuard, MemberAvatar } from '../../components/tba';
import { PERMISSIONS } from 'constants/permissions.constants';
import DependentEditDrawer from './DependentEditDrawer';

// Relationship Translation Map
export const RELATIONSHIP_AR = {
  WIFE: 'زوجة',
  HUSBAND: 'زوج',
  SON: 'ابن',
  DAUGHTER: 'ابنة',
  FATHER: 'أب',
  MOTHER: 'أم',
  BROTHER: 'أخ',
  SISTER: 'أخت'
};

/**
 * Unified Member View Component
 */
const UnifiedMemberView = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);

  // Edit Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedDependent, setSelectedDependent] = useState(null);

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
  });
  const [dependentPhoto, setDependentPhoto] = useState(null);
  const [dependentPhotoPreview, setDependentPhotoPreview] = useState(null);

  // Dependents Pagination
  const [pg, setPg] = useState(0);
  const [rpp, setRpp] = useState(3);

  const handleChangePage = (event, newPage) => {
    setPg(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRpp(parseInt(event.target.value, 10));
    setPg(0);
  };

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

  const handleEditClick = (dep) => {
    setSelectedDependent(dep);
    setEditDrawerOpen(true);
  };

  const handleEditSave = () => {
    fetchMember();
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

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDependentPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDependentPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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
        nationality: newDependent.nationality || 'ليبي',
      };

      const newDepResponse = await addDependent(member.id, payload);

      // Upload Photo if exists
      if (dependentPhoto && newDepResponse.id) {
        try {
          await uploadPhoto(newDepResponse.id, dependentPhoto);
        } catch (photoError) {
          console.error("Failed to upload photo for new dependent", photoError);
          openSnackbar({
            open: true,
            message: 'تم إضافة التابع ولكن فشل رفع الصورة',
            variant: 'alert',
            alert: { color: 'warning' }
          });
        }
      }

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
        nationality: 'ليبي',
      });
      setDependentPhoto(null);
      setDependentPhotoPreview(null);
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
        subtitle={isPrincipal ? 'منتفع رئيسي' : 'منتفع تابع'}
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
                fontSize: theme.typography.body2.fontSize,
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
            <Tab label="بيانات المستفيد" icon={<PersonIcon />} iconPosition="start" />
            {isPrincipal && <Tab label={`التابعون (${dependents.length})`} icon={<FamilyRestroomIcon />} iconPosition="start" />}
          </Tabs>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>

          {/* Tab 0: Personal Info */}
          <div role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Grid container spacing={2} sx={{ height: '100%' }}>
                {/* Left Sidebar: Photo & IDs (Compact) */}
                <Grid size={{ xs: 12, md: 3 }} sx={{ height: '100%' }}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <MemberAvatar member={member} size={100} sx={{ mb: 1.5 }} />

                    <Stack spacing={1} alignItems="center" width="100%">
                      <Stack direction="row" spacing={1}>
                        <Chip label={isPrincipal ? 'رئيسي' : 'تابع'} color={isPrincipal ? 'primary' : 'secondary'} size="small" />
                        <Chip label={member.status === 'ACTIVE' ? 'نشط' : member.status} color={member.status === 'ACTIVE' ? 'success' : 'default'} size="small" />
                      </Stack>

                      <Divider flexItem sx={{ width: '100%', my: 1.5 }} />

                      <Box sx={{ width: '100%', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block">رقم البطاقة</Typography>
                        <Typography variant="subtitle1" fontFamily="monospace" fontWeight="bold">{member.cardNumber || '-'}</Typography>
                      </Box>

                      {isPrincipal && member.barcode && (
                        <Box sx={{ width: '100%', textAlign: 'center', mt: 1, p: 1, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <QrCodeIcon color="primary" fontSize="small" />
                            <Typography variant="caption" color="primary.main">Barcode</Typography>
                          </Stack>
                          <Typography variant="subtitle2" color="primary.main" fontWeight="bold">{member.barcode}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                {/* Right Content Area: Personal + Emp + Contact */}
                <Grid size={{ xs: 12, md: 9 }} sx={{ height: '100%' }}>
                  <Stack spacing={2} sx={{ height: '100%' }}>

                    {/* Top: Personal Info Box */}
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>البيانات الشخصية</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                          <Typography variant="caption" color="text.secondary">الاسم الكامل</Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{member.fullName}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <Typography variant="caption" color="text.secondary">الرقم الوطني</Typography>
                          <Typography variant="body2" fontFamily="monospace">{member.nationalNumber || '-'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <Typography variant="caption" color="text.secondary">الجنسية</Typography>
                          <Typography variant="body2">{member.nationality || '-'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary">تاريخ الميلاد</Typography>
                          <Typography variant="body2">{member.birthDate || '-'}</Typography>
                        </Grid>

                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary">الجنس</Typography>
                          <Typography variant="body2">{member.gender === GENDERS.MALE ? 'ذكر' : member.gender === GENDERS.FEMALE ? 'أنثى' : '-'}</Typography>
                        </Grid>


                        <Grid size={{ xs: 12 }}>
                          {member.notes && (
                            <Typography variant="caption" sx={{ display: 'block', bgcolor: 'warning.lighter', color: 'warning.dark', p: 0.5, borderRadius: 0.5 }}>
                              ملاحظات: {member.notes}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Bottom Split: Employment & Contact */}
                    <Grid container spacing={2} sx={{ flex: 1 }}>
                      {/* Employment (if principal) */}
                      {isPrincipal && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                              <BadgeIcon fontSize="small" color="action" />
                              <Typography variant="subtitle2" fontWeight="bold">بيانات العمل</Typography>
                            </Stack>
                            <Stack spacing={1.5}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">جهة العمل</Typography>
                                <Typography variant="body2" fontWeight="medium">{member.employerName || '-'}</Typography>
                              </Box>
                              <Grid container>
                                <Grid size={6}>
                                  <Typography variant="caption" color="text.secondary">الرقم الوظيفي</Typography>
                                  <Typography variant="body2" fontFamily="monospace">{member.employeeNumber || '-'}</Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant="caption" color="text.secondary">المهنة</Typography>
                                  <Typography variant="body2">{member.occupation || '-'}</Typography>
                                </Grid>
                              </Grid>

                            </Stack>
                          </Paper>
                        </Grid>
                      )}

                      {/* Contact Info - Takes full width if not principal */}
                      <Grid size={{ xs: 12, md: isPrincipal ? 6 : 12 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                            <ContactPhoneIcon fontSize="small" color="action" />
                            <Typography variant="subtitle2" fontWeight="bold">معلومات الاتصال</Typography>
                          </Stack>
                          <Stack spacing={2}>
                            <Grid container>
                              <Grid size={6}>
                                <Typography variant="caption" color="text.secondary">رقم الهاتف</Typography>
                                <Typography variant="body2" dir="ltr">{member.phone || '-'}</Typography>
                              </Grid>
                              <Grid size={6}>
                                <Typography variant="caption" color="text.secondary">البريد الإلكتروني</Typography>
                                <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>{member.email || '-'}</Typography>
                              </Grid>
                            </Grid>
                            <Box>
                              <Typography variant="caption" color="text.secondary">العنوان</Typography>
                              <Typography variant="body2">{member.address || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>

                  </Stack>
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab 1: Dependents (Principal Only) */}
          <div role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && isPrincipal && (
              <Stack spacing={3}>
                {/* Inline Form - Single Row */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>إضافة تابع جديد</Typography>
                    <Button variant="outlined" color="error" size="small" startIcon={<DeleteOutlineIcon />}>
                      المحذوفات
                    </Button>
                  </Stack>

                  <Grid container spacing={2} alignItems="center">
                    {/* Photo Upload */}
                    <Grid size={{ xs: 12, md: 1 }}>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="dependent-photo-upload"
                        type="file"
                        onChange={handlePhotoChange}
                      />
                      <label htmlFor="dependent-photo-upload">
                        <IconButton component="span" sx={{ p: 0 }}>
                          <Avatar
                            src={dependentPhotoPreview}
                            sx={{ width: 40, height: 40, border: '1px dashed grey' }}
                          >
                            <PersonAddIcon fontSize="small" />
                          </Avatar>
                        </IconButton>
                      </label>
                    </Grid>

                    {/* Full Name */}
                    <Grid size={{ xs: 12, md: 2.5 }}>
                      <TextField
                        fullWidth
                        required
                        label="الاسم الكامل"
                        value={newDependent.fullName}
                        onChange={handleDepFieldChange('fullName')}
                        error={!!depErrors.fullName}
                        size="small"
                        placeholder="الاسم الثلاثي"
                      />
                    </Grid>

                    {/* Relationship */}
                    <Grid size={{ xs: 6, md: 2 }}>
                      <FormControl fullWidth required error={!!depErrors.relationship} size="small">
                        <InputLabel>القرابة</InputLabel>
                        <Select
                          value={newDependent.relationship}
                          onChange={handleDepFieldChange('relationship')}
                          label="القرابة"
                        >
                          {Object.entries(RELATIONSHIPS).map(([key, value]) => (
                            <MenuItem key={key} value={value}>
                              {RELATIONSHIP_AR[value] || value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Gender */}
                    <Grid size={{ xs: 6, md: 1.5 }}>
                      <FormControl fullWidth required error={!!depErrors.gender} size="small">
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
                      </FormControl>
                    </Grid>

                    {/* Nationality */}
                    <Grid size={{ xs: 6, md: 1.5 }}>
                      <TextField
                        fullWidth
                        label="الجنسية"
                        value={newDependent.nationality}
                        onChange={handleDepFieldChange('nationality')}
                        size="small"
                      />
                    </Grid>

                    {/* Birth Date */}
                    <Grid size={{ xs: 12, md: 2 }}>
                      <DatePicker
                        label="تاريخ الميلاد *"
                        value={newDependent.birthDate}
                        onChange={handleDepDateChange('birthDate')}
                        maxDate={dayjs()}
                        slotProps={{ textField: { fullWidth: true, size: 'small', error: !!depErrors.birthDate } }}
                      />
                    </Grid>

                    {/* Action Button */}
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={addingDependent ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleAddDependentSubmit}
                        disabled={addingDependent}
                        size="medium"
                      >
                        إضافة
                      </Button>
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
                    <>
                      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ minHeight: 230 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell align="center">#</TableCell>
                              <TableCell align="right">الاسم</TableCell>
                              <TableCell align="center">القرابة</TableCell>
                              <TableCell align="center">رقم البطاقة</TableCell>
                              <TableCell align="center">الجنس</TableCell>
                              <TableCell align="center">تاريخ الميلاد</TableCell>
                              <TableCell align="center">الحالة</TableCell>
                              <TableCell align="center">إجراءات</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dependents
                              .slice(pg * rpp, pg * rpp + rpp)
                              .map((dep, index) => (
                                <TableRow key={dep.id} hover>
                                  <TableCell align="center">{pg * rpp + index + 1}</TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">{dep.fullName}</Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip label={RELATIONSHIP_AR[dep.relationship] || dep.relationship} size="small" variant="outlined" color="primary" />
                                  </TableCell>
                                  <TableCell align="center">{dep.cardNumber || '-'}</TableCell>
                                  <TableCell align="center">
                                    {dep.gender === GENDERS.MALE ? 'ذكر' : dep.gender === GENDERS.FEMALE ? 'أنثى' : '-'}
                                  </TableCell>
                                  <TableCell align="center">{dep.birthDate || '-'}</TableCell>
                                  <TableCell align="center">
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
                                        <IconButton size="small" color="secondary" onClick={() => handleEditClick(dep)}>
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
                      <TablePagination
                        rowsPerPageOptions={[3, 6, 9]}
                        component="div"
                        count={dependents.length}
                        rowsPerPage={rpp}
                        page={pg}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="صفوف لكل صفحة:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
                      />
                    </>
                  )}
                </Box>
              </Stack>
            )}
          </div>
        </Box>
      </MainCard >

      {/* Delete Confirmation Dialog */}
      < Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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

      </Dialog >

      <DependentEditDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        dependent={selectedDependent}
        onSave={handleEditSave}
      />
    </RBACGuard >
  );
};

export default UnifiedMemberView;
