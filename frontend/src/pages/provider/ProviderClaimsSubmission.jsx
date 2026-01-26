/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       PROVIDER CLAIMS SUBMISSION - Visit-Centric Canonical Architecture      ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  REBUILD: 2026-01-16                                                         ║
 * ║  ARCHITECTURAL LAWS ENFORCED:                                                ║
 * ║  ❌ No claim without Visit (visitId is MANDATORY)                            ║
 * ║  ❌ No free-text service (must select from dropdown)                         ║
 * ║  ❌ No manual price entry (price comes from Provider Contract)               ║
 * ║  ✅ Data Flow: Visit → Member → Contract → Services → Prices → Claim         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Divider,
  LinearProgress,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Autocomplete,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Send,
  Delete,
  Person,
  MedicalServices,
  ArrowBack,
  Add as AddIcon,
  CreditCard as CardIcon,
  LocalHospital as VisitIcon,
  Lock as LockIcon,
  Error as ErrorIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  Attachment as AttachmentIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import MedicalServicePicker from 'components/MedicalServicePicker';
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import SuccessDialog from 'components/SuccessDialog';
import { useAuth } from 'contexts/AuthContext';
import axiosClient from 'utils/axios';
// Removed: getActiveContractByProvider, getContractPricingItems - these require VIEW_PROVIDER_CONTRACTS permission
// Now using Provider Portal endpoints: /api/provider/my-contract and /api/provider/my-contract/services

// ══════════════════════════════════════════════════════════════════════════════
// LABELS (Arabic)
// ══════════════════════════════════════════════════════════════════════════════
const LABELS = {
  pageTitle: 'إنشاء مطالبة',
  pageSubtitle: 'تقديم مطالبة تأمينية من سجل الزيارات',
  visitRequired: 'يجب الوصول لهذه الصفحة من سجل الزيارات',
  visitInfo: 'بيانات الزيارة',
  memberInfo: 'بيانات المؤمن عليه',
  serviceLines: 'الخدمات الطبية',
  addService: 'إضافة خدمة',
  selectService: 'اختر الخدمة الطبية',
  quantity: 'الكمية',
  unitPrice: 'سعر الوحدة',
  totalPrice: 'الإجمالي',
  noServices: 'أضف خدمة واحدة على الأقل',
  noContract: 'لا يوجد عقد لهذه الخدمة',
  diagnosis: 'التشخيص',
  diagnosisCode: 'رمز التشخيص (ICD-10)',
  diagnosisDescription: 'وصف التشخيص',
  notes: 'ملاحظات',
  submit: 'تقديم المطالبة',
  submitting: 'جاري التقديم...',
  back: 'رجوع',
  totalClaimAmount: 'إجمالي المطالبة',
  remainingLimit: 'الحد المتبقي',
  annualLimit: 'الحد السنوي',
  usedAmount: 'المستخدم',
  priceReadOnly: 'السعر محسوب من العقد (للقراءة فقط)',
  // TICKET 2: PA-Required UX Warnings
  paRequiredWarning: 'هذه الخدمة تتطلب موافقة مسبقة قبل تقديم المطالبة',
  paRequiredBlocker: 'لا يمكن تقديم المطالبة - يوجد خدمات تتطلب موافقة مسبقة',
  // Attachments
  attachments: 'المرفقات والمستندات',
  attachmentHint: 'يمكنك إرفاق التقارير الطبية، الفواتير، أو المستندات الداعمة',
  selectFiles: 'اختر ملفات للرفع',
  uploadingFiles: 'جاري رفع الملفات...'
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
const SectionHeader = ({ icon: Icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    <Icon color="primary" />
    <Typography variant="h6" fontWeight="bold">
      {title}
    </Typography>
  </Box>
);

const ReadOnlyField = ({ label, value, icon: Icon }) => (
  <Box sx={{ mb: 1 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Stack direction="row" alignItems="center" spacing={1}>
      {Icon && <Icon fontSize="small" color="action" />}
      <Typography variant="body1" fontWeight="500">
        {value || '-'}
      </Typography>
    </Stack>
  </Box>
);

const ContractPriceChip = ({ loading, price, hasContract, error }) => {
  if (loading) return <CircularProgress size={16} />;
  if (error) return <Chip label={error} color="error" size="small" />;
  if (!hasContract) return <Chip label={LABELS.noContract} color="warning" size="small" />;
  return <Chip icon={<LockIcon />} label={`${Number(price).toLocaleString()} د.ل`} color="success" size="small" />;
};

// ══════════════════════════════════════════════════════════════════════════════
// BLOCKED ACCESS PAGE
// ══════════════════════════════════════════════════════════════════════════════
const BlockedAccessPage = ({ onBack }) => (
  <MainCard>
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
      <Typography variant="h4" gutterBottom color="error">
        لا يمكن الوصول لهذه الصفحة مباشرة
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {LABELS.visitRequired}
      </Typography>
      <Alert severity="warning" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
        <Typography variant="body2">
          <strong>المعمارية الجديدة:</strong> يجب إنشاء المطالبات من صفحة سجل الزيارات فقط.
          <br />
          <strong>السبب:</strong> لضمان ربط المطالبة بزيارة موثقة ومعتمدة.
        </Typography>
      </Alert>
      <Button variant="contained" startIcon={<ArrowBack />} onClick={onBack}>
        الذهاب لسجل الزيارات
      </Button>
    </Box>
  </MainCard>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function ProviderClaimsSubmission() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // ═══════════════════════════════════════════════════════════════════════════
  // VISIT CONTEXT (FROM STATE OR URL PARAMS - supports refresh)
  // ═══════════════════════════════════════════════════════════════════════════
  const fromVisitLog = location.state?.fromVisitLog || searchParams.get('fromVisitLog') === 'true';
  const linkedVisitId = location.state?.visitId || searchParams.get('visitId') ? parseInt(searchParams.get('visitId')) : null;
  const linkedMemberId = location.state?.memberId || searchParams.get('memberId') ? parseInt(searchParams.get('memberId')) : null;
  const linkedMemberName = location.state?.memberName || searchParams.get('memberName') || null;
  const linkedMemberCivilId = location.state?.memberCivilId || searchParams.get('memberCivilId') || null;
  const linkedMemberCardNumber = location.state?.memberCardNumber || searchParams.get('cardNumber') || null;
  const linkedEmployerName = location.state?.employerName || searchParams.get('employer') || null;
  const linkedMemberPhone = location.state?.memberPhone || searchParams.get('phone') || null;
  const linkedMemberEmail = location.state?.memberEmail || searchParams.get('email') || null;
  const linkedVisitDate = location.state?.visitDate || searchParams.get('visitDate') || null;
  const linkedVisitTime = location.state?.visitTime || searchParams.get('visitTime') || null;
  const linkedVisitType = location.state?.visitType || searchParams.get('visitType') || null;
  const linkedProviderName = location.state?.providerName || searchParams.get('providerName') || null;

  // SUPER_ADMIN check
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  
  // ARCHITECTURAL ENFORCEMENT: Block direct access (SUPER_ADMIN can bypass)
  const accessBlocked = !linkedVisitId && !isSuperAdmin;

  // Provider from user session
  const userProviderId = user?.providerId || null;
  const userProviderName = user?.providerName || null;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Visit details loaded from backend
  const [visitDetails, setVisitDetails] = useState(null);

  // Member remaining limit
  const [memberLimit, setMemberLimit] = useState(null);

  // Medical services from Provider Contract
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(''); // NEW: Category filter

  // Claim Lines
  const [claimLines, setClaimLines] = useState([]);
  const [lineIdCounter, setLineIdCounter] = useState(1);

  // Form Data
  const [formData, setFormData] = useState({
    diagnosisCode: '',
    diagnosisDescription: '',
    doctorName: '',
    notes: '',
    preAuthorizationId: '' // TICKET 2: Added Pre-Auth ID
  });

  // Attachments State
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (linkedVisitId && !accessBlocked) {
      initializePage();
    }
  }, [linkedVisitId, accessBlocked]);

  const initializePage = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled to handle individual API failures gracefully
      const results = await Promise.allSettled([fetchVisitDetails(), fetchAvailableServices(), fetchMemberLimit()]);

      // Log any failed promises but don't fail the whole page
      results.forEach((result, index) => {
        const names = ['Visit Details', 'Services', 'Member Limit'];
        if (result.status === 'rejected') {
          console.warn(`Failed to load ${names[index]}:`, result.reason);
        }
      });
    } catch (err) {
      console.error('Initialization error:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitDetails = async () => {
    if (!linkedVisitId) return;
    try {
      // Use provider-specific endpoint that's accessible to PROVIDER role
      const response = await axiosClient.get(`/provider/visits/${linkedVisitId}`);
      setVisitDetails(response.data?.data || response.data);
    } catch (err) {
      console.error('Failed to fetch visit:', err);
    }
  };

  const fetchAvailableServices = async () => {
    // ════════════════════════════════════════════════════════════════════════════
    // FIX: Use Provider Portal endpoints that work with PROVIDER role
    // Old: /provider-contracts/provider/{id}/active (requires VIEW_PROVIDER_CONTRACTS)
    // New: /provider/my-contract/services (works with PROVIDER role)
    // ════════════════════════════════════════════════════════════════════════════
    setLoadingServices(true);
    try {
      // Use the Provider Portal endpoint - works for PROVIDER role without special permissions
      const response = await axiosClient.get('/provider/my-contract/services', {
        params: { size: 2000 } // Get all services in one request
      });
      
      const data = response.data?.data || response.data;
      const items = data?.content || data?.items || data || [];
      
      if (items.length === 0) {
        console.warn('No services found in active contract');
        setAvailableServices([]);
        return;
      }
      
      // Map to component format
      setAvailableServices(
        items.map((item) => {
          // CRITICAL: Use medicalServiceId (not pricing item id) for claim creation
          const serviceId = item.medicalServiceId || item.id;
          console.log(`📋 Service: ${item.serviceCode}, medicalServiceId=${item.medicalServiceId}, id=${item.id}, using=${serviceId}`);
          
          return {
            id: serviceId,  // This MUST be MedicalService ID
            code: item.serviceCode,
            name: item.serviceName || item.serviceNameAr,
            nameArabic: item.serviceNameAr || item.serviceName,
            category: item.categoryName || '',
            categoryCode: item.categoryCode || '',
            requiresPA: item.requiresPA || item.requiresPreAuth || false,
            
            // Contract Price is key here
            price: item.contractPrice,
            basePrice: item.basePrice,
            contractId: item.contractId,
            
            hasContract: item.hasContract !== false
          };
        })
      );
      
      console.log(`✅ Loaded ${items.length} services from provider contract`);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      
      // Fallback: Try the my-services endpoint
      try {
        const response = await axiosClient.get('/provider/my-services');
        const services = response.data?.data || response.data || [];
        setAvailableServices(
          services.map((s) => ({
            id: s.serviceId || s.id,
            code: s.service_code || s.serviceCode || s.code,
            name: s.service_name || s.serviceName || s.name,
            nameArabic: s.service_name_arabic || s.serviceNameArabic || s.nameArabic || s.name_arabic || s.name,
            category: s.category_name || s.categoryName || s.category || '',
            categoryCode: s.category_code || s.categoryCode || '',
            requiresPA: s.requires_pre_auth ?? s.requiresPreAuth ?? s.requiresPA ?? false,
            hasContract: true // Assume they have contract if returned from my-services
          }))
        );
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setAvailableServices([]);
      }
    } finally {
      setLoadingServices(false);
    }
  };

  // Extract unique categories from services
  const serviceCategories = useMemo(() => {
    const categories = new Set();
    availableServices.forEach((s) => {
      if (s.category) categories.add(s.category);
    });
    return Array.from(categories).sort();
  }, [availableServices]);

  // Filter services by category
  const filteredServices = useMemo(() => {
    if (!categoryFilter) return availableServices;
    return availableServices.filter((s) => s.category === categoryFilter);
  }, [availableServices, categoryFilter]);

  const fetchMemberLimit = async () => {
    if (!linkedMemberId) return;
    try {
      const response = await axiosClient.get(`/members/${linkedMemberId}/remaining-limit`);
      setMemberLimit(response.data?.data || response.data);
    } catch (err) {
      console.error('Failed to fetch member limit:', err);
      setMemberLimit(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACT PRICE RESOLUTION
  // TICKET 3: Standardized response handling
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchContractPrice = useCallback(
    async (serviceCode, lineId) => {
      if (!userProviderId || !serviceCode) return;

      // OPTIMIZATION: Check if price is already available in the fetched service list (Contract Source)
      const cachedService = availableServices.find(s => s.code === serviceCode);
      if (cachedService && cachedService.hasContract && cachedService.price !== undefined) {
         setClaimLines((prev) =>
          prev.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  unitPrice: cachedService.price,
                  hasContract: true,
                  loadingPrice: false,
                  priceError: null
                }
              : line
          )
        );
        return;
      }

      setClaimLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, loadingPrice: true, priceError: null } : line)));

      try {
        // ════════════════════════════════════════════════════════════════════════
        // FIX: Use Provider Portal endpoint which properly supports PROVIDER role
        // Old: /providers/${userProviderId}/services/${serviceCode}/price (requires VIEW_PROVIDERS)
        // New: /provider/my-services/${serviceCode}/price (PROVIDER role allowed)
        // ════════════════════════════════════════════════════════════════════════
        const response = await axiosClient.get(`/provider/my-services/${serviceCode}/price`);
        // TICKET 3: Standardized response structure: response.data.data.contractPrice
        const priceData = response.data?.data || response.data;

        // TICKET 3: Check hasContract flag for proper handling
        if (priceData.hasContract && priceData.contractPrice != null) {
          setClaimLines((prev) =>
            prev.map((line) =>
              line.id === lineId
                ? {
                    ...line,
                    unitPrice: priceData.contractPrice,
                    hasContract: true,
                    loadingPrice: false
                  }
                : line
            )
          );
        } else {
          // No contract found - handle gracefully
          setClaimLines((prev) =>
            prev.map((line) =>
              line.id === lineId
                ? {
                    ...line,
                    unitPrice: 0,
                    hasContract: false,
                    loadingPrice: false,
                    priceError: LABELS.noContract
                  }
                : line
            )
          );
        }
      } catch (err) {
        setClaimLines((prev) =>
          prev.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  unitPrice: 0,
                  hasContract: false,
                  loadingPrice: false,
                  priceError: LABELS.noContract
                }
              : line
          )
        );
      }
    },
    [userProviderId, availableServices]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // CLAIM LINE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  const addClaimLine = () => {
    setClaimLines((prev) => [
      ...prev,
      {
        id: lineIdCounter,
        medicalServiceId: null,
        serviceName: '',
        serviceCode: '',
        quantity: 1,
        unitPrice: 0,
        hasContract: false,
        loadingPrice: false,
        priceError: null,
        requiresPA: false // TICKET 2: Track PA requirement
      }
    ]);
    setLineIdCounter((prev) => prev + 1);
  };

  const removeClaimLine = (lineId) => {
    setClaimLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const updateClaimLine = (lineId, field, value) => {
    setClaimLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)));
  };

  const handleServiceSelect = (lineId, service) => {
    if (!service) {
      updateClaimLine(lineId, 'medicalServiceId', null);
      updateClaimLine(lineId, 'serviceName', '');
      updateClaimLine(lineId, 'serviceCode', '');
      updateClaimLine(lineId, 'unitPrice', 0);
      updateClaimLine(lineId, 'hasContract', false);
      updateClaimLine(lineId, 'requiresPA', false);
      return;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // OPTIMIZATION: Use price from the pre-loaded service list (from /my-contract/services)
    // This avoids an extra API call and uses the already-loaded contract price
    // ════════════════════════════════════════════════════════════════════════════
    const hasContractPrice = service.hasContract !== false && service.price !== undefined && service.price !== null;
    
    console.log(`📋 Service selected: ${service.code}, id=${service.id}, price=${service.price}, hasContract=${hasContractPrice}`);

    setClaimLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              medicalServiceId: service.id,
              serviceName: service.nameArabic || service.name,
              serviceCode: service.code,
              unitPrice: hasContractPrice ? service.price : 0,
              hasContract: hasContractPrice,
              loadingPrice: false,
              priceError: hasContractPrice ? null : LABELS.noContract,
              requiresPA: service.requiresPA || false
            }
          : line
      )
    );

    // Only fetch price if not already available (fallback for edge cases)
    if (!hasContractPrice) {
      fetchContractPrice(service.code, lineId);
    }
  };

  // Calculate totals
  const calculateLineTotal = (line) => (line.unitPrice || 0) * (line.quantity || 1);
  const totalClaimAmount = claimLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);

  // NOTE: hasServicesRequiringPA check removed - PA requirement now comes from BenefitPolicyRule

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTACHMENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.map((file) => ({
      file,
      type: 'MEDICAL_REPORT' // Default type
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
    event.target.value = ''; // Reset input
  };

  const handleRemoveFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileTypeChange = (index, type) => {
    setPendingFiles((prev) => prev.map((f, i) => (i === index ? { ...f, type } : f)));
  };

  const uploadAttachments = async (claimId) => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    let uploaded = 0;

    for (const { file, type } of pendingFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('attachmentType', type);

        await axiosClient.post(`/claims/${claimId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploaded++;
        setUploadProgress(Math.round((uploaded / pendingFiles.length) * 100));
      } catch (err) {
        console.error('Failed to upload file:', file.name, err);
      }
    }

    setUploading(false);
    setUploadProgress(0);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validateForm = () => {
    if (!linkedVisitId) {
      setError('لا يوجد رقم زيارة مرتبط');
      return false;
    }

    if (claimLines.length === 0) {
      setError('يجب إضافة خدمة واحدة على الأقل');
      return false;
    }

    const invalidLines = claimLines.filter((line) => !line.medicalServiceId || !line.hasContract);
    if (invalidLines.length > 0) {
      setError('بعض الخدمات غير صالحة أو غير موجودة في العقد');
      return false;
    }

    // TICKET 2: If services require PA, preAuthorizationId must be provided
    // Restored this check as it was accidentally removed but is still logically sound
    if (claimLines.some(l => l.requiresPA) && !formData.preAuthorizationId) {
      setError('يجب إدخال رقم الموافقة المسبقة لأن المطالبة تحتوي على خدمات تتطلب موافقة');
      return false;
    }

    // TICKET 3: Attachment Validation
    // Check if at least one file is pending for upload
    // Note: The backend enforces attachment rules, but we can do a preliminary check here
    if (pendingFiles.length === 0) {
      setError('يجب إرفاق ملف واحد على الأقل (تقرير طبي أو فاتورة) لتقديم المطالبة');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        visitId: parseInt(linkedVisitId),
        memberId: parseInt(linkedMemberId),
        providerId: userProviderId,
        preAuthorizationId: formData.preAuthorizationId || null, // TICKET 2: Mapped Pre-Auth ID
        diagnosisCode: formData.diagnosisCode || null,
        diagnosisDescription: formData.diagnosisDescription || null,
        doctorName: formData.doctorName || null,
        serviceDate: linkedVisitDate || visitDetails?.visitDate || null, // Ensure service date is sent
        notes: formData.notes || null,
        lines: claimLines.map((line) => ({
          medicalServiceId: line.medicalServiceId,
          quantity: line.quantity || 1
        }))
      };
      
      // DEBUG: Log payload to verify medicalServiceId values
      console.log('🚀 Claim Payload:', JSON.stringify(payload, null, 2));
      console.log('📋 Claim Lines:', claimLines.map(l => ({ 
        id: l.id, 
        medicalServiceId: l.medicalServiceId, 
        serviceCode: l.serviceCode,
        serviceName: l.serviceName 
      })));

      const response = await axiosClient.post('/claims', payload);
      const result = response.data?.data || response.data;
      const claimId = result.id;

      // Upload attachments if any
      if (pendingFiles.length > 0 && claimId) {
        // Wait for ALL uploads to complete successfully before attempting submission
        await uploadAttachments(claimId);
      } else {
         // Should be caught by validateForm, but double check
         // If we are here and no files, proceed only if validation allowed it (which it shouldn't)
      }

      // ════════════════════════════════════════════════════════════════════════
      // FIX: SUBMIT CLAIM (Transition DRAFT → SUBMITTED)
      // ════════════════════════════════════════════════════════════════════════
      // The initial POST /claims creates a DRAFT. We must explicituly submit it
      // so it appears in the Review Queue.
      await axiosClient.post(`/claims/${claimId}/submit`);

      setSuccess({
        message: 'تم تقديم المطالبة للمراجعة بنجاح',
        claimId: claimId,
        referenceNumber: result.claimNumber || result.referenceNumber,
        attachmentsCount: pendingFiles.length
      });
    } catch (err) {
      console.error('Submit error:', err);
      // Improved error message extraction
      const errorData = err.response?.data;
      let errorMsg = 'فشل في تقديم المطالبة';
      
      if (errorData) {
        if (errorData.message) errorMsg = errorData.message;
        else if (errorData.error) errorMsg = errorData.error;
        else if (typeof errorData === 'string') errorMsg = errorData;
      }
      
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER - BLOCKED ACCESS
  // ═══════════════════════════════════════════════════════════════════════════
  if (accessBlocked) {
    return <BlockedAccessPage onBack={() => navigate('/provider/visits')} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER - MAIN PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <ModernPageHeader
        title={LABELS.pageTitle}
        subtitle={LABELS.pageSubtitle}
        icon={MedicalServices}
        breadcrumbs={[{ label: 'بوابة مقدم الخدمة' }, { label: 'سجل الزيارات', href: '/provider/visits' }, { label: LABELS.pageTitle }]}
      />

      <MainCard>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Dialog - Central notification with auto-redirect */}
        <SuccessDialog
          open={!!success}
          type="claim"
          title="تم تقديم المطالبة بنجاح! 🎉"
          subtitle="تم إرسال المطالبة للمراجعة من قبل فريق التأمين"
          referenceNumber={success?.referenceNumber || success?.claimId}
          attachmentsCount={success?.attachmentsCount || 0}
          redirectPath="/provider/visits"
          redirectLabel="العودة لسجل الزيارات"
          countdownSeconds={5}
          viewDetailsPath={success?.claimId ? `/claims/${success.claimId}` : null}
          additionalInfo={[
            { label: 'المؤمَّن عليه', value: linkedMemberName || '—' },
            { label: 'عدد الخدمات', value: `${claimLines.length} خدمة` }
          ]}
        />

        {/* VISIT & MEMBER INFO */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <SectionHeader icon={VisitIcon} title={LABELS.visitInfo} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <ReadOnlyField label="رقم الزيارة" value={`#${linkedVisitId}`} icon={VisitIcon} />
                  </Grid>
                  <Grid item xs={6}>
                    <ReadOnlyField label="تاريخ الزيارة" value={linkedVisitDate || visitDetails?.visitDate || '-'} />
                  </Grid>
                  <Grid item xs={6}>
                    <ReadOnlyField label="وقت الزيارة" value={linkedVisitTime || '-'} />
                  </Grid>
                  <Grid item xs={6}>
                    <ReadOnlyField
                      label="نوع الزيارة"
                      value={
                        {
                          OUTPATIENT: 'عيادة خارجية',
                          INPATIENT: 'تنويم',
                          EMERGENCY: 'طوارئ',
                          DENTAL: 'أسنان',
                          OPTICAL: 'بصريات'
                        }[linkedVisitType] ||
                        linkedVisitType ||
                        '-'
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ReadOnlyField
                      label="مقدم الخدمة"
                      value={linkedProviderName || userProviderName || visitDetails?.providerName || '-'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <SectionHeader icon={Person} title={LABELS.memberInfo} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ReadOnlyField label="اسم المؤمن عليه" value={linkedMemberName} icon={Person} />
                  </Grid>
                  <Grid item xs={6}>
                    <ReadOnlyField label="رقم البطاقة" value={linkedMemberCardNumber} icon={CardIcon} />
                  </Grid>
                  <Grid item xs={6}>
                    <ReadOnlyField label="الرقم المدني" value={linkedMemberCivilId} />
                  </Grid>
                  <Grid item xs={12}>
                    <ReadOnlyField label="جهة العمل" value={linkedEmployerName} />
                  </Grid>
                  {linkedMemberPhone && (
                    <Grid item xs={6}>
                      <ReadOnlyField label="الهاتف" value={linkedMemberPhone} />
                    </Grid>
                  )}
                </Grid>
                {memberLimit && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {LABELS.annualLimit}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Number(memberLimit.annualLimit || 0).toLocaleString()} د.ل
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {LABELS.usedAmount}
                      </Typography>
                      <Typography variant="body2">{Number(memberLimit.usedAmount || 0).toLocaleString()} د.ل</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {LABELS.remainingLimit}
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {Number(memberLimit.remainingLimit || 0).toLocaleString()} د.ل
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={memberLimit.usagePercentage || 0}
                      color={memberLimit.usagePercentage >= 80 ? 'error' : 'success'}
                      sx={{ mt: 1, height: 6, borderRadius: 1 }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CLAIM LINES */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <SectionHeader icon={MedicalServices} title={LABELS.serviceLines} />
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addClaimLine} disabled={submitting || success}>
                {LABELS.addService}
              </Button>
            </Box>

            {/* Category Filter */}
            {serviceCategories.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FilterIcon color="action" />
                <FormControl size="small" sx={{ minWidth: 250 }}>
                  <InputLabel>فلترة حسب التصنيف</InputLabel>
                  <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="فلترة حسب التصنيف">
                    <MenuItem value="">
                      <em>جميع التصنيفات ({availableServices.length} خدمة)</em>
                    </MenuItem>
                    {serviceCategories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat} ({availableServices.filter((s) => s.category === cat).length})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {categoryFilter && (
                  <Chip
                    label={`${categoryFilter} (${filteredServices.length})`}
                    onDelete={() => setCategoryFilter('')}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
            )}

            {claimLines.length === 0 ? (
              <Alert severity="info">{LABELS.noServices}</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell width="40%">{LABELS.selectService}</TableCell>
                      <TableCell width="15%" align="center">
                        {LABELS.quantity}
                      </TableCell>
                      <TableCell width="20%" align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                          <LockIcon fontSize="small" color="action" />
                          <span>{LABELS.unitPrice}</span>
                        </Stack>
                      </TableCell>
                      <TableCell width="15%" align="center">
                        {LABELS.totalPrice}
                      </TableCell>
                      <TableCell width="10%" align="center"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {claimLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Autocomplete
                            size="small"
                            options={filteredServices}
                            getOptionLabel={(option) => {
                              const code = option.code ? `[${option.code}] ` : '';
                              return `${code}${option.nameArabic || option.name || ''}`;
                            }}
                            filterOptions={(options, { inputValue }) => {
                              const search = inputValue.toLowerCase();
                              return options.filter(
                                (opt) =>
                                  (opt.code && opt.code.toLowerCase().includes(search)) ||
                                  (opt.name && opt.name.toLowerCase().includes(search)) ||
                                  (opt.nameArabic && opt.nameArabic.includes(search))
                              );
                            }}
                            loading={loadingServices}
                            onChange={(_, value) => handleServiceSelect(line.id, value)}
                            disabled={submitting || success}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="ابحث برمز الخدمة أو اسمها..."
                                error={!line.medicalServiceId && claimLines.length > 0}
                              />
                            )}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              const categoryLabel = option.category || 'غير مصنف';
                              return (
                                <li key={key} {...otherProps}>
                                  <Box sx={{ width: '100%', py: 0.5 }}>
                                    {/* Code + Name Row */}
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Chip
                                        label={option.code}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}
                                      />
                                      <Typography variant="body2" fontWeight="medium">
                                        {option.nameArabic || option.name}
                                      </Typography>
                                    </Stack>
                                    {/* Category Row */}
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                      🗂 التصنيف: {categoryLabel}
                                    </Typography>
                                    {/* Contract Price Indicator */}
                                    {option.price && (
                                      <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                        💰 سعر العقد: {Number(option.price).toLocaleString()} د.ل
                                      </Typography>
                                    )}
                                  </Box>
                                </li>
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={line.quantity}
                            onChange={(e) => updateClaimLine(line.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={submitting || success}
                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                            sx={{ width: 70 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <ContractPriceChip
                            loading={line.loadingPrice}
                            price={line.unitPrice}
                            hasContract={line.hasContract}
                            error={line.priceError}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold">{calculateLineTotal(line).toLocaleString()} د.ل</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => removeClaimLine(line.id)} disabled={submitting || success}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'primary.lighter' }}>
                      <TableCell colSpan={3} align="left">
                        <Typography variant="subtitle1" fontWeight="bold">
                          {LABELS.totalClaimAmount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {totalClaimAmount.toLocaleString()} د.ل
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Alert severity="info" sx={{ mt: 2 }} icon={<LockIcon />}>
              {LABELS.priceReadOnly}
            </Alert>
          </CardContent>
        </Card>

        {/* DIAGNOSIS & NOTES */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <SectionHeader icon={MedicalServices} title={LABELS.diagnosis} />
            <Grid container spacing={2}>
              {/* NOTE: Pre-Authorization field removed - PA requirement comes from BenefitPolicyRule */}
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={LABELS.diagnosisCode}
                  value={formData.diagnosisCode}
                  onChange={handleFormChange('diagnosisCode')}
                  disabled={submitting || success}
                  placeholder="مثال: J00"
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label={LABELS.diagnosisDescription}
                  value={formData.diagnosisDescription}
                  onChange={handleFormChange('diagnosisDescription')}
                  disabled={submitting || success}
                  placeholder="وصف التشخيص..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label={LABELS.notes}
                  value={formData.notes}
                  onChange={handleFormChange('notes')}
                  disabled={submitting || success}
                  placeholder="ملاحظات إضافية..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ATTACHMENTS SECTION */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <SectionHeader icon={AttachmentIcon} title={LABELS.attachments} />
            <Alert severity="info" sx={{ mb: 2 }}>
              {LABELS.attachmentHint}
            </Alert>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
              disabled={submitting || success}
              sx={{
                height: 80,
                borderStyle: 'dashed',
                borderWidth: 2,
                mb: 2
              }}
            >
              {LABELS.selectFiles}
              <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileSelect} />
            </Button>

            {pendingFiles.length > 0 && (
              <Stack spacing={1}>
                {pendingFiles.map((item, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <AttachmentIcon color="action" />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {item.file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(item.file.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                      <TextField
                        select
                        size="small"
                        value={item.type}
                        onChange={(e) => handleFileTypeChange(index, e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{ width: 130 }}
                      >
                        <option value="MEDICAL_REPORT">تقرير طبي</option>
                        <option value="INVOICE">فاتورة</option>
                        <option value="LAB_RESULT">نتائج مختبر</option>
                        <option value="XRAY">أشعة</option>
                        <option value="PRESCRIPTION">وصفة طبية</option>
                        <option value="OTHER">أخرى</option>
                      </TextField>
                      <IconButton size="small" color="error" onClick={() => handleRemoveFile(index)} disabled={submitting || success}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                ))}
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  سيتم رفع {pendingFiles.length} ملف عند تقديم المطالبة
                </Typography>
              </Stack>
            )}

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={0.5}>
                  {LABELS.uploadingFiles} {uploadProgress}%
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* NOTE: PA-Required Warning removed - PA requirement comes from BenefitPolicyRule, not MedicalService */}

        {/* ACTION BUTTONS */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/provider/visits')} disabled={submitting}>
            {LABELS.back}
          </Button>
          {!success && (
            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
              onClick={handleSubmit}
              disabled={submitting || claimLines.length === 0}
            >
              {submitting ? LABELS.submitting : LABELS.submit}
            </Button>
          )}
        </Box>
      </MainCard>
    </>
  );
}
