/**
 * Unified Member View Page
 * 
 * Displays Principal member with expandable Dependents list.
 * Shows Barcode (WAHA-YYYY-NNNNNN) for Principal only.
 * Shows Card Numbers for Principal (NNNNNN) and Dependents (NNNNNN-NN).
 * 
 * @module UnifiedMemberView
 * @since 2026-01-11
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PeopleAlt as PeopleAltIcon,
  PersonAdd as PersonAddIcon,
  QrCode as QrCodeIcon,
  CreditCard as CreditCardIcon,
  ExpandMore as ExpandMoreIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  Wc as WcIcon
} from '@mui/icons-material';

import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import { getMember, deleteMember, MEMBER_TYPES, RELATIONSHIPS, GENDERS } from 'services/api/unified-members.service';
import { openSnackbar } from 'api/snackbar';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';

/**
 * Unified Member View Component
 */
const UnifiedMemberView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);

  useEffect(() => {
    if (id) {
      fetchMember();
    }
  }, [id]);

  const fetchMember = async () => {
    setLoading(true);
    try {
      const response = await getMember(id);
      console.log('Member data:', response);
      setMember(response.data);
    } catch (error) {
      console.error('Error fetching member:', error);
      openSnackbar({
        open: true,
        message: 'خطأ في جلب بيانات العضو',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setLoading(false);
    }
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
          ? 'تم حذف العضو الأصيل وجميع تابعيه بنجاح'
          : 'تم حذف التابع بنجاح',
        variant: 'alert',
        alert: { color: 'success' }
      });

      if (isPrincipal) {
        // If deleting principal, navigate back to list
        navigate('/members');
      } else {
        // If deleting dependent, refresh member data
        fetchMember();
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      openSnackbar({
        open: true,
        message: error.response?.data?.message || 'خطأ في حذف العضو',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingMember(null);
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
        <Alert severity="error">لم يتم العثور على العضو</Alert>
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
        subtitle={isPrincipal ? 'عضو أصيل (Principal)' : 'تابع (Dependent)'}
        icon={isPrincipal ? <BadgeIcon /> : <PeopleAltIcon />}
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: 'الأعضاء', href: '/members' },
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

      <Grid container spacing={3}>
        {/* Main Member Card */}
        <Grid item xs={12} lg={8}>
          <MainCard
            title={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5">المعلومات الأساسية</Typography>
                <Chip
                  label={isPrincipal ? 'أصيل' : 'تابع'}
                  color={isPrincipal ? 'primary' : 'secondary'}
                  size="small"
                />
                <Chip
                  label={member.status}
                  color={
                    member.status === 'ACTIVE' ? 'success' :
                    member.status === 'SUSPENDED' ? 'warning' : 'error'
                  }
                  size="small"
                />
              </Stack>
            }
          >
            <Grid container spacing={3}>
              {/* Barcode - Principal Only */}
              {isPrincipal && member.barcode && (
                <Grid item xs={12}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: 'primary.lighter' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <QrCodeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Barcode (للأصيل فقط)
                        </Typography>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          {member.barcode}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              )}

              {/* Card Number */}
              {member.cardNumber && (
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CreditCardIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          رقم البطاقة
                        </Typography>
                        <Typography variant="h5" fontWeight="medium">
                          {member.cardNumber}
                        </Typography>
                        {!isPrincipal && (
                          <Typography variant="caption" color="text.secondary">
                            بصيغة: {member.cardNumber.split('-')[0]}-{member.cardNumber.split('-')[1]}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Personal Info */}
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    الاسم الكامل
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {member.fullName}
                  </Typography>
                </Stack>
              </Grid>

              {member.nationalNumber && (
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      الرقم المدني
                    </Typography>
                    <Typography variant="body1">{member.nationalNumber}</Typography>
                  </Stack>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CakeIcon fontSize="small" color="action" />
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      تاريخ الميلاد
                    </Typography>
                    <Typography variant="body1">{member.birthDate || '-'}</Typography>
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WcIcon fontSize="small" color="action" />
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      الجنس
                    </Typography>
                    <Typography variant="body1">
                      {member.gender === GENDERS.MALE ? 'ذكر' : member.gender === GENDERS.FEMALE ? 'أنثى' : '-'}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>

              {/* Relationship (Dependent Only) */}
              {!isPrincipal && member.relationship && (
                <Grid item xs={12}>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      القرابة
                    </Typography>
                    <Chip label={member.relationship} color="primary" variant="outlined" />
                  </Stack>
                </Grid>
              )}

              {/* Contact Info */}
              {(member.phone || member.email) && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {member.phone && (
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon fontSize="small" color="action" />
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            رقم الهاتف
                          </Typography>
                          <Typography variant="body1">{member.phone}</Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                  )}

                  {member.email && (
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" color="action" />
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            البريد الإلكتروني
                          </Typography>
                          <Typography variant="body1">{member.email}</Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                  )}
                </>
              )}

              {/* Employment Info (Principal) */}
              {isPrincipal && (member.employerName || member.benefitPolicyName) && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {member.employerName && (
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BusinessIcon fontSize="small" color="action" />
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            جهة العمل
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {member.employerName}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                  )}

                  {member.benefitPolicyName && (
                    <Grid item xs={12}>
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          البوليصة
                        </Typography>
                        <Typography variant="body1">
                          {member.benefitPolicyName} ({member.benefitPolicyCode})
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                </>
              )}

              {/* Notes */}
              {member.notes && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        ملاحظات
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.notes}
                      </Typography>
                    </Stack>
                  </Grid>
                </>
              )}
            </Grid>
          </MainCard>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Quick Actions */}
            <MainCard title="إجراءات سريعة">
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/members/${id}/edit`)}
                >
                  تعديل البيانات
                </Button>
                {isPrincipal && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={() => navigate(`/members/${id}/add-dependent`)}
                  >
                    إضافة تابع
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteConfirm(member)}
                >
                  حذف {isPrincipal ? 'الأصيل وتابعيه' : 'التابع'}
                </Button>
              </Stack>
            </MainCard>

            {/* Statistics (Principal Only) */}
            {isPrincipal && (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" gutterBottom>
                      إحصائيات
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        عدد التابعين
                      </Typography>
                      <Chip label={member.dependentsCount || 0} color="primary" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* Dependents Section (Principal Only) */}
        {isPrincipal && (
          <Grid item xs={12}>
            <Accordion defaultExpanded={dependents.length > 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <PeopleAltIcon color="primary" />
                  <Typography variant="h5">التابعون (Dependents)</Typography>
                  {dependents.length > 0 && (
                    <Chip label={`${dependents.length} تابع`} color="success" size="small" />
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {dependents.length === 0 ? (
                  <Alert
                    severity="info"
                    action={
                      <Button
                        color="primary"
                        size="small"
                        startIcon={<PersonAddIcon />}
                        onClick={() => navigate(`/members/${id}/add-dependent`)}
                      >
                        إضافة تابع
                      </Button>
                    }
                  >
                    لا يوجد تابعون لهذا العضو الأصيل
                  </Alert>
                ) : (
                  <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>الاسم</TableCell>
                          <TableCell>القرابة</TableCell>
                          <TableCell>رقم البطاقة</TableCell>
                          <TableCell>تاريخ الميلاد</TableCell>
                          <TableCell>الجنس</TableCell>
                          <TableCell>الحالة</TableCell>
                          <TableCell align="center">إجراءات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dependents.map((dep, index) => (
                          <TableRow key={dep.id} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {dep.fullName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={dep.relationship}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {dep.cardNumber || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>{dep.birthDate || '-'}</TableCell>
                            <TableCell>
                              {dep.gender === GENDERS.MALE ? 'ذكر' :
                               dep.gender === GENDERS.FEMALE ? 'أنثى' : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={dep.status || 'ACTIVE'}
                                size="small"
                                color={dep.status === 'ACTIVE' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/members/${dep.id}`)}
                                  title="عرض"
                                >
                                  <BadgeIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => navigate(`/members/${dep.id}/edit`)}
                                  title="تعديل"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteConfirm(dep)}
                                  title="حذف"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deletingMember?.type === MEMBER_TYPES.PRINCIPAL ? (
              <>
                هل أنت متأكد من حذف العضو الأصيل <strong>{deletingMember?.fullName}</strong>؟
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
