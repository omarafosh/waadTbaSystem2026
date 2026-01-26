/**
 * Provider Portal - Eligibility Check Page
 * 
 * Healthcare provider interface for real-time eligibility verification.
 * Matches the main EligibilityCheckPage design and functionality.
 * 
 * Supported Methods:
 * 1. QR/Barcode Scan (camera or hardware scanner)
 * 2. Card Number / Barcode Entry
 * 
 * @version 2.0 - Aligned with EligibilityCheckPage
 * @since Phase 1 - Provider Portal
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  QrCodeScanner as QrIcon,
  CreditCard as CardIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  FamilyRestroom as FamilyIcon,
  LocalHospital as HospitalIcon,
  EventNote as VisitIcon,
  Description,
  CheckCircle as CheckCircleIcon  
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import MainCard from 'components/MainCard';
import { providerApi } from 'services/providerService';

export default function ProviderEligibilityCheck() {
  const navigate = useNavigate();
  // ========================================
  // STATE
  // ========================================
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // QR Scanner State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const html5QrCodeRef = useRef(null);
  
  // Visit Registration State (NEW FLOW 2026-01-13)
  const [registeringVisit, setRegisteringVisit] = useState(false);
  const [selectedVisitType, setSelectedVisitType] = useState('');
  
  // Visit Type Options
  const VISIT_TYPE_OPTIONS = [
    { value: 'OUTPATIENT', label: 'عيادة خارجية' },
    { value: 'INPATIENT', label: 'تنويم' },
    { value: 'EMERGENCY', label: 'طوارئ' },
    { value: 'DAY_CARE', label: 'رعاية يومية' },
    { value: 'FOLLOW_UP', label: 'متابعة' }
  ];

  // ========================================
  // HELPERS
  // ========================================

  /**
   * Detect if input is a barcode format (WAHA-XXXX-XXXXXXXX or similar)
   */
  const isBarcode = (value) => {
    const barcodePattern = /^[A-Z]+-\d{4}-\d+$/i;
    return barcodePattern.test(value.trim());
  };

  /**
   * Format currency (Libyan Dinar)
   */
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Get usage percentage color
   */
  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  // ========================================
  // API CALL
  // ========================================

  const checkEligibility = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setError('الرجاء إدخال رقم البطاقة أو مسح الباركود');
      return;
    }

    setResult(null);
    setError(null);
    setSelectedMember(null);
    setLoading(true);

    try {
      const trimmedValue = query.trim();
      
      // الفحص يتم فقط بالباركود أو رقم البطاقة
      // الرقم الوطني لا يُستخدم للفحص - يظهر فقط كمعلومات أساسية
      const request = {
        barcode: trimmedValue  // يقبل الباركود أو رقم البطاقة
      };
      
      console.log('[Provider Eligibility] Request payload:', request);
      
      const response = await providerApi.checkEligibility(request);

      setResult(response);
      
      // Auto-select principal if only one eligible member
      if (response.eligibleMembersCount === 1 && response.familyMembers?.length === 1) {
        setSelectedMember(response.familyMembers[0]);
      }
    } catch (err) {
      console.error('[Provider Eligibility] Check failed:', err);
      
      // Enhanced error handling - extract meaningful message
      let errorMessage = 'حدث خطأ أثناء التحقق من الأهلية';
      
      if (err.parsedError) {
        // Use parsed error from service
        errorMessage = err.parsedError.message;
      } else if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle validation errors with field details
        if (errorData.errorCode === 'VALIDATION_ERROR' || errorData.code === 'VALIDATION_ERROR') {
          if (errorData.details && typeof errorData.details === 'object') {
            const fieldErrors = Object.entries(errorData.details)
              .map(([field, msg]) => {
                const arabicNames = {
                  barcode: 'الباركود/رقم البطاقة',
                  cardNumber: 'رقم البطاقة',
                  serviceDate: 'تاريخ الخدمة'
                };
                return `${arabicNames[field] || field}: ${msg}`;
              })
              .join('، ');
            errorMessage = fieldErrors || 'خطأ في البيانات المدخلة';
          } else {
            errorMessage = errorData.message || 'فشل التحقق من صحة البيانات';
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.messageAr) {
          errorMessage = errorData.messageAr;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Log detailed error for debugging
      if (err.response?.status === 400) {
        console.warn('[Provider Eligibility] Validation error details:', {
          status: err.response.status,
          errorCode: err.response.data?.errorCode,
          details: err.response.data?.details,
          message: err.response.data?.message
        });
      }
      
      setError(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // INPUT HANDLERS
  // ========================================

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSubmit = () => {
    checkEligibility(searchValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      handleSubmit();
    }
  };

  const handleReset = () => {
    setSearchValue('');
    setResult(null);
    setError(null);
    setSelectedMember(null);
  };

  // ========================================
  // QR SCANNER HANDLERS
  // ========================================

  const startQrScanner = async () => {
    setScannerOpen(true);
    setCameraError(null);
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-provider');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          stopQrScanner();
          setScannerOpen(false);
          setSearchValue(decodedText);
          checkEligibility(decodedText);
        },
        () => { /* Continuous scanning errors - ignore */ }
      );
    } catch (err) {
      console.error('[QR Scanner] Failed to start:', err);
      setCameraError('فشل الوصول إلى الكاميرا. يمكنك استخدام ماسح الباركود المتصل بالجهاز');
      setScanning(false);
    }
  };

  const stopQrScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('[QR Scanner] Failed to stop:', err);
      }
    }
    setScanning(false);
  };

  const handleCloseScannerDialog = () => {
    stopQrScanner();
    setScannerOpen(false);
    setCameraError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ========================================
  // HARDWARE SCANNER SUPPORT
  // ========================================

  useEffect(() => {
    let buffer = '';
    let timeout = null;

    const handleKeyDown = (e) => {
      if (document.activeElement?.id === 'scanner-input-provider') {
        clearTimeout(timeout);
        
        if (e.key === 'Enter' && buffer.trim()) {
          e.preventDefault();
          setSearchValue(buffer.trim());
          checkEligibility(buffer.trim());
          buffer = '';
        } else if (e.key.length === 1) {
          buffer += e.key;
          
          timeout = setTimeout(() => {
            if (buffer.trim()) {
              setSearchValue(buffer.trim());
              checkEligibility(buffer.trim());
              buffer = '';
            }
          }, 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [checkEligibility]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <HospitalIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
              التحقق من الأهلية - بوابة مقدم الخدمة
            </Typography>
            <Typography variant="body2" color="text.secondary">
              تحقق من أهلية المنتفع باستخدام رقم البطاقة أو مسح الباركود/QR
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid xs={12} lg={5}>
          <MainCard title="طرق التحقق" sx={{ height: '100%' }}>
            <Stack spacing={3}>
              {/* Method 1: QR/Barcode Scanner */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  1. مسح الباركود / QR Code
                </Typography>
                
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<QrIcon />}
                    onClick={startQrScanner}
                    disabled={loading || scanning}
                    fullWidth
                  >
                    مسح باستخدام الكاميرا
                  </Button>

                  <TextField
                    id="scanner-input-provider"
                    fullWidth
                    placeholder="أو وجّه الماسح الضوئي هنا..."
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                    helperText="الماسحات الضوئية (Scanners) تعمل تلقائياً عند تركيز المؤشر هنا"
                  />
                </Stack>
              </Box>

              <Divider>
                <Chip label="أو" size="small" />
              </Divider>

              {/* Method 2: Manual Entry */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  2. إدخال رقم البطاقة يدوياً
                </Typography>
                
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="رقم البطاقة أو الباركود"
                    placeholder="WAHA-2026-000001 أو رقم البطاقة"
                    value={searchValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CardIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                    helperText="أدخل رقم البطاقة (أرقام فقط) أو الباركود الكامل"
                    sx={{ direction: 'ltr' }}
                  />

                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || !searchValue.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                    fullWidth
                  >
                    {loading ? 'جاري الفحص...' : 'فحص الأهلية'}
                  </Button>
                </Stack>
              </Box>

              {/* Error Display */}
              {error && (
                <Alert 
                  severity="error" 
                  onClose={() => setError(null)}
                  sx={{ mt: 2 }}
                >
                  {error}
                </Alert>
              )}
            </Stack>
          </MainCard>
        </Grid>

        {/* Result Section */}
        <Grid xs={12} lg={7}>
          {result ? (
            <MainCard 
              title="نتيجة الفحص"
              secondary={
                <IconButton onClick={handleReset} size="small" title="إعادة ضبط">
                  <RefreshIcon />
                </IconButton>
              }
            >
              <Stack spacing={3}>
                {/* Eligibility Status */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: result.eligible ? 'success.lighter' : 'error.lighter',
                    border: 1,
                    borderColor: result.eligible ? 'success.main' : 'error.main'
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {result.eligible ? (
                      <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                    )}
                    <Box flex={1}>
                      <Typography variant="h5" color={result.eligible ? 'success.dark' : 'error.dark'}>
                        {result.message}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        رقم الباركود: {result.barcode || 'غير متوفر'}
                      </Typography>
                    </Box>
                    <Chip
                      label={result.eligible ? 'مؤهل' : 'غير مؤهل'}
                      color={result.eligible ? 'success' : 'error'}
                      size="large"
                    />
                  </Stack>

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {result.warnings.map((warning, index) => (
                        <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                          {warning}
                        </Alert>
                      ))}
                    </Box>
                  )}
                </Paper>

                {/* Principal Member Info */}
                {result.principalMember && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {result.principalMember.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          العضو الرئيسي - {result.employerName || 'جهة العمل غير محددة'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}

                {/* Coverage Info */}
                <Grid container spacing={2}>
                  <Grid xs={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                      <Typography variant="body2" color="text.secondary">
                        الحد السنوي
                      </Typography>
                      <Typography variant="h6" color="primary.dark">
                        {formatCurrency(result.principalAnnualLimit)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid xs={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter' }}>
                      <Typography variant="body2" color="text.secondary">
                        المستخدم
                      </Typography>
                      <Typography variant="h6" color="warning.dark">
                        {formatCurrency(result.principalUsedAmount)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid xs={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
                      <Typography variant="body2" color="text.secondary">
                        المتبقي
                      </Typography>
                      <Typography variant="h6" color="success.dark">
                        {formatCurrency(result.principalRemainingLimit)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid xs={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                      <Typography variant="body2" color="text.secondary">
                        نسبة الاستخدام
                      </Typography>
                      <Typography variant="h6">
                        {(result.principalUsagePercentage || 0).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Family Members Table */}
                {result.familyMembers && result.familyMembers.length > 0 && (
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <FamilyIcon color="primary" />
                      <Typography variant="h6">
                        أفراد العائلة ({result.totalFamilyMembers || result.familyMembers.length})
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      يرجى اختيار المريض من القائمة أدناه للمتابعة
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>الاسم</TableCell>
                            <TableCell>الصلة</TableCell>
                            <TableCell>العمر</TableCell>
                            <TableCell>الحالة</TableCell>
                            <TableCell>المتبقي</TableCell>
                            <TableCell>النسبة</TableCell>
                            <TableCell align="center">اختيار</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.familyMembers.map((member) => (
                            <TableRow 
                              key={member.memberId}
                              selected={selectedMember?.memberId === member.memberId}
                              hover
                              sx={{ 
                                cursor: member.eligible ? 'pointer' : 'default',
                                bgcolor: member.isPrincipal ? 'primary.lighter' : 'inherit',
                                opacity: member.eligible ? 1 : 0.6
                              }}
                              onClick={() => member.eligible && setSelectedMember(member)}
                            >
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PersonIcon fontSize="small" color={member.isPrincipal ? 'primary' : 'action'} />
                                  <Box>
                                    <Typography variant="body2" fontWeight={member.isPrincipal ? 'bold' : 'normal'}>
                                      {member.fullName}
                                    </Typography>
                                    {member.isPrincipal && (
                                      <Chip label="رئيسي" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                                    )}
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell>{member.relationship || 'SELF'}</TableCell>
                              <TableCell>{member.age || '-'}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={member.eligible ? 'مؤهل' : 'غير مؤهل'} 
                                  color={member.eligible ? 'success' : 'error'} 
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{formatCurrency(member.remainingLimit)}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={member.usagePercentage || 0} 
                                    color={getUsageColor(member.usagePercentage || 0)}
                                    sx={{ height: 6, borderRadius: 1, flex: 1, minWidth: 50 }}
                                  />
                                  <Typography variant="caption">
                                    {(member.usagePercentage || 0).toFixed(0)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  variant={selectedMember?.memberId === member.memberId ? 'contained' : 'outlined'}
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMember(member);
                                  }}
                                  disabled={!member.eligible}
                                  color={selectedMember?.memberId === member.memberId ? 'primary' : 'inherit'}
                                >
                                  {selectedMember?.memberId === member.memberId ? 'محدد ✓' : 'اختيار'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Selected Member Action - NEW FLOW: Register Visit */}
                {selectedMember && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2">
                          تم اختيار: <strong>{selectedMember.fullName}</strong>
                        </Typography>
                        <Typography variant="body2">
                          الحد المتبقي: <strong>{formatCurrency(selectedMember.remainingLimit)}</strong>
                        </Typography>
                      </Box>
                      
                      {/* Visit Type Selection - REQUIRED */}
                      <FormControl fullWidth size="small" required error={!selectedVisitType}>
                        <InputLabel id="visit-type-label">نوع الزيارة *</InputLabel>
                        <Select
                          labelId="visit-type-label"
                          value={selectedVisitType}
                          onChange={(e) => setSelectedVisitType(e.target.value)}
                          label="نوع الزيارة *"
                        >
                          {VISIT_TYPE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {!selectedVisitType && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            يجب اختيار نوع الزيارة قبل التسجيل
                          </Typography>
                        )}
                      </FormControl>
                      
                      <Button 
                        variant="contained" 
                        color="primary"
                        fullWidth
                        startIcon={registeringVisit ? <CircularProgress size={20} color="inherit" /> : <VisitIcon />}
                        disabled={registeringVisit || !selectedVisitType}
                        onClick={async () => {
                          // Validate visit type before registration
                          if (!selectedVisitType) {
                            setError('يجب اختيار نوع الزيارة');
                            return;
                          }
                          
                          // NEW FLOW: Register Visit first, then go to Visit Log
                          setRegisteringVisit(true);
                          try {
                            const visitResponse = await providerApi.registerVisit({
                              memberId: selectedMember.memberId,
                              eligibilityCheckId: result.eligibilityCheckId,
                              visitType: selectedVisitType
                            });
                            
                            if (visitResponse.success) {
                              // Navigate to visit log with success message
                              navigate('/provider/visits', {
                                state: {
                                  successMessage: `تم تسجيل الزيارة بنجاح للمريض ${selectedMember.fullName}`,
                                  newVisitId: visitResponse.visitId
                                }
                              });
                            } else {
                              setError(visitResponse.message || 'فشل في تسجيل الزيارة');
                            }
                          } catch (err) {
                            console.error('Failed to register visit:', err);
                            setError(err.message || 'فشل في تسجيل الزيارة');
                          } finally {
                            setRegisteringVisit(false);
                          }
                        }}
                      >
                        {registeringVisit ? 'جاري التسجيل...' : 'تسجيل زيارة'}
                      </Button>
                    </Stack>
                  </Alert>
                )}

                {/* Covered Services */}
                {result.coveredServices && result.coveredServices.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      الخدمات المغطاة:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {result.coveredServices.map((service, index) => (
                        <Chip 
                          key={index}
                          label={service} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </MainCard>
          ) : (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: 'background.default',
                border: '1px dashed',
                borderColor: 'divider',
                height: '100%',
                minHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box>
                <QrIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  في انتظار الفحص
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  استخدم إحدى الطرق لفحص أهلية المنتفع
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* QR Scanner Dialog */}
      <Dialog
        open={scannerOpen}
        onClose={handleCloseScannerDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          مسح الباركود / QR Code
          <IconButton
            onClick={handleCloseScannerDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {cameraError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {cameraError}
            </Alert>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                وجّه الكاميرا نحو الباركود أو QR Code
              </Typography>
              <Box
                id="qr-reader-provider"
                sx={{
                  width: '100%',
                  '& video': {
                    width: '100%',
                    borderRadius: 1
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScannerDialog}>
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
