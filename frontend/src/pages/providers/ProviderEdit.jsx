import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
    getEmployerSelectors
} from 'services/api/employers.service';
import {
    providersService
} from 'services/api/providers.service'; // Import service for contracts
import { usersService } from 'services/rbac/users.service';
import { rolesService } from 'services/rbac/roles.service';
import {
    Box,
    Button,
    Grid,
    TextField,
    MenuItem,
    Typography,
    Tabs,
    Tab,
    Paper,
    Divider,
    Alert,
    InputAdornment,
    Chip,
    Switch,
    FormControlLabel,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Stack,

    IconButton,
    CircularProgress
} from '@mui/material';
import {
    ArrowBack,
    Save,
    LocalHospital as ProviderIcon,
    Business,
    LocationOn,
    Phone,
    Description,
    Handshake,
    Warning,
    People,
    Add as AddIcon,
    Person,
    Lock,
    VpnKey,
    Delete as DeleteIcon,
    Block,
    CheckCircle,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import RBACGuard from 'components/tba/RBACGuard';
import { PERMISSIONS } from 'constants/permissions.constants';
import { useProviderDetails, useUpdateProvider } from 'hooks/useProviders';

const PROVIDER_TYPES = [
    { value: 'HOSPITAL', label: 'مستشفى' },
    { value: 'CLINIC', label: 'عيادة' },
    { value: 'LAB', label: 'مختبر' },
    { value: 'PHARMACY', label: 'صيدلية' },
    { value: 'RADIOLOGY', label: 'مركز أشعة' }
];

const NETWORK_STATUS_OPTIONS = [
    { value: 'IN_NETWORK', label: 'داخل الشبكة', description: 'مقدم خدمة معتمد داخل الشبكة' },
    { value: 'OUT_OF_NETWORK', label: 'خارج الشبكة', description: 'مقدم خدمة خارج الشبكة' },
    { value: 'PREFERRED', label: 'مزود مفضل', description: 'مقدم خدمة مفضل بخصومات أعلى' }
];

const ProviderEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { provider, loading } = useProviderDetails(id);
    const { update, updating } = useUpdateProvider();

    // State
    const [activeTab, setActiveTab] = useState(0);
    const [payers, setPayers] = useState([]);
    const [loadingPayers, setLoadingPayers] = useState(false);

    // User Account State
    const [linkedUser, setLinkedUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [userForm, setUserForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Password Reset Dialog State
    const [resetPasswordDialog, setResetPasswordDialog] = useState({
        open: false,
        newPassword: '',
        confirmPassword: ''
    });

    // Documents State
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [docDialog, setDocDialog] = useState({ open: false, type: 'LICENSE', expiryDate: '', notes: '', fileName: '' });
    const [deleteDocDialog, setDeleteDocDialog] = useState({ open: false, docId: null });
    const [previewDialog, setPreviewDialog] = useState({ open: false, url: '', title: '' });
    const [previewLoading, setPreviewLoading] = useState(false);
    const [docPage, setDocPage] = useState(0);
    const [docRowsPerPage, setDocRowsPerPage] = useState(3);

    const DOC_TYPE_LABELS = {
        'LICENSE': 'رخصة مزاولة مهنة',
        'COMMERCIAL_REGISTER': 'سجل تجاري',
        'TAX_CERTIFICATE': 'شهادة ضريبية',
        'CONTRACT_COPY': 'نسخة العقد',
        'OTHER': 'أخرى'
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        licenseNumber: '',
        taxNumber: '',
        city: '',
        address: '',
        phone: '',
        email: '',
        providerType: '',
        networkStatus: '',
        contractStartDate: '',
        contractEndDate: '',
        defaultDiscountRate: '',
        active: true
    });

    const [errors, setErrors] = useState({});

    // Confirm Dialog
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        payerId: null,
        action: 'enable',
        payerName: ''
    });

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(3);

    // Load Provider Data
    useEffect(() => {
        if (provider) {
            setFormData({
                name: provider.name || '',
                licenseNumber: provider.licenseNumber || '',
                taxNumber: provider.taxNumber || '',
                city: provider.city || '',
                address: provider.address || '',
                phone: provider.phone || '',
                email: provider.email || '',
                providerType: provider.providerType || '',
                networkStatus: provider.networkStatus || '',
                contractStartDate: provider.contractStartDate || '',
                contractEndDate: provider.contractEndDate || '',
                defaultDiscountRate: provider.defaultDiscountRate || '',
                active: provider.active !== undefined ? provider.active : true
            });
        }
    }, [provider]);

    // Load Payers and Contracts to determine status
    useEffect(() => {
        const loadPartnersData = async () => {
            if (!id) return;
            setLoadingPayers(true);
            try {
                // 1. Get All Possible Employers
                const employersRes = await getEmployerSelectors();
                const allEmployers = Array.isArray(employersRes) ? employersRes : (employersRes.data || []);

                // 2. Get Active Contracts for this Provider
                // contracts usually contain { employerId, status, ... }
                const contractsRes = await providersService.getContracts(id);
                const activeContracts = Array.isArray(contractsRes) ? contractsRes : [];

                // 3. Map status
                const mapped = allEmployers.map(emp => {
                    const empId = emp.id || emp.value;
                    const hasActiveContract = activeContracts.some(
                        c => (c.employerId === empId || c.employer?.id === empId)
                    );

                    return {
                        id: empId,
                        name: emp.label || emp.name,
                        code: emp.code || 'EMP',
                        logo: (emp.label || emp.name || 'X').charAt(0).toUpperCase(),
                        enabled: hasActiveContract, // True validity from DB based on contract existence
                        contractId: activeContracts.find(c => (c.employerId === empId || c.employer?.id === empId))?.id // Keep track if needed
                    };
                });

                setPayers(mapped);
            } catch (error) {
                console.error('Error loading partners data', error);
                enqueueSnackbar('فشل تحميل بيانات الشركاء والعقود', { variant: 'error' });
            } finally {
                setLoadingPayers(false);
            }
        };

        loadPartnersData();
    }, [id, enqueueSnackbar]);

    // Load Linked User
    useEffect(() => {
        const fetchLinkedUser = async () => {
            if (!id) return;

            setLoadingUser(true);
            try {
                let users = [];
                // Strategy: Search by email (primary) or Name (secondary)
                // This ensures we find the user even if they have a dummy email (e.g. @provider.local)
                const query = formData.email || formData.name;

                if (query) {
                    const response = await usersService.searchUsers(query);
                    const data = response?.data?.data || response?.data || response || [];
                    if (Array.isArray(data)) users = data;
                }

                // Find best match
                // 1. Match by Email (Exact)
                // 2. Match by Name (Exact)
                // 3. Match by Name (Contains) - Optional, maybe too loose

                let match = null;
                if (users.length > 0) {
                    match = users.find(u =>
                        (formData.email && u.email?.toLowerCase() === formData.email?.toLowerCase()) ||
                        (u.fullName === formData.name) ||
                        (u.username === formData.email) // Edge case: searching by username
                    );

                    // Fallback: if we searched by name and found only one user with that name
                    if (!match && !formData.email && users.length > 0) {
                        // Filter strictly by name to avoid partial matches on common words
                        const nameMatches = users.filter(u => u.fullName === formData.name);
                        if (nameMatches.length === 1) match = nameMatches[0];
                    }
                }

                setLinkedUser(match);
            } catch (error) {
                console.error('Error fetching linked user:', error);
            } finally {
                setLoadingUser(false);
            }
        };

        if (activeTab === 3) {
            fetchLinkedUser();
        }
    }, [activeTab, id, formData.email, formData.name]);

    const handleCreateUser = async () => {
        if (!userForm.username || !userForm.password) {
            enqueueSnackbar('يرجى تعبئة اسم المستخدم وكلمة المرور', { variant: 'warning' });
            return;
        }
        if (userForm.password !== userForm.confirmPassword) {
            enqueueSnackbar('كلمة المرور غير متطابقة', { variant: 'error' });
            return;
        }

        try {
            setLoadingUser(true);

            // Auto-generate email if not provided to bypass backend validation
            // Checks if username is already an email address to avoid double suffix
            let finalEmail = formData.email;
            if (!finalEmail) {
                const isEmailRaw = userForm.username.includes('@') && userForm.username.includes('.');
                finalEmail = isEmailRaw ? userForm.username : `${userForm.username}@provider.local`;
            }

            // 1. Create User
            // Note: passing providerId to link explicitly if backend supports it
            const payload = {
                username: userForm.username,
                password: userForm.password,
                email: finalEmail, // Use real or generated email
                fullName: formData.name, // Enforce same name
                providerId: id,
                enabled: true,
                roles: [] // Will assign role next
            };

            const createdUser = await usersService.createUser(payload);
            // Fix: Extract ID from the standard ApiResponse structure (data.data.id)
            const userId = createdUser?.data?.data?.id || createdUser?.data?.id || createdUser?.id;

            if (userId) {
                // 2. Assign PROVIDER role
                // First fetch roles to find ID
                const rolesRes = await rolesService.getAllRoles();
                const roles = rolesRes?.data?.data || rolesRes?.data || [];
                const providerRole = roles.find(r => r.name === 'PROVIDER' || r.code === 'PROVIDER');

                if (providerRole) {
                    await usersService.assignRoles(userId, [providerRole.id]);
                }

                enqueueSnackbar('تم إنشاء حساب المستخدم بنجاح', { variant: 'success' });
                // Refresh
                setLinkedUser({ ...payload, id: userId });
            }

        } catch (error) {
            console.error(error);
            enqueueSnackbar(error.response?.data?.message || 'فشل إنشاء الحساب', { variant: 'error' });
        } finally {
            setLoadingUser(false);
        }
    };

    // User Actions
    const handleToggleUserStatus = async () => {
        if (!linkedUser) return;
        try {
            setLoadingUser(true);
            const res = await usersService.toggleUserStatus(linkedUser.id);
            // res is expected to be { success: true, data: user }
            const updatedUser = res?.data || res;
            // Update local state, handling potentially different field names (active vs enabled)
            const isActive = updatedUser.active !== undefined ? updatedUser.active : updatedUser.enabled;
            setLinkedUser(prev => ({ ...prev, active: isActive, enabled: isActive }));

            enqueueSnackbar(isActive ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب', { variant: 'success' });
        } catch (error) {
            console.error(error);
            enqueueSnackbar('فشل تحديث حالة الحساب', { variant: 'error' });
        } finally {
            setLoadingUser(false);
        }
    };

    const handleOpenResetPassword = () => {
        setResetPasswordDialog({ open: true, newPassword: '', confirmPassword: '' });
    };

    const handleSubmitResetPassword = async () => {
        if (resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword) {
            enqueueSnackbar('كلمة المرور غير متطابقة', { variant: 'error' });
            return;
        }
        try {
            await usersService.resetUserPassword(linkedUser.id, resetPasswordDialog.newPassword);
            enqueueSnackbar('تم تغيير كلمة المرور بنجاح', { variant: 'success' });
            setResetPasswordDialog({ ...resetPasswordDialog, open: false });
        } catch (error) {
            console.error(error);
            enqueueSnackbar('فشل تغيير كلمة المرور', { variant: 'error' });
        }
    };


    // Handlers for Documents
    useEffect(() => {
        if (activeTab === 4 && id) {
            fetchDocuments();
        }
    }, [activeTab, id]);

    const fetchDocuments = async () => {
        try {
            setLoadingDocs(true);
            const docs = await providersService.getDocuments(id);
            setDocuments(docs || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleAddDocument = async () => {
        if (!docDialog.fileName || !docDialog.type) {
            enqueueSnackbar('يرجى اختيار نوع المستند والملف', { variant: 'warning' });
            return;
        }

        // Prevent duplicate upload
        if (documents.some(d => d.fileName === docDialog.fileName)) {
            enqueueSnackbar('هذا الملف موجود مسبقاً. يرجى تغيير الاسم أو اختيار ملف آخر.', { variant: 'warning' });
            return;
        }

        try {
            const formData = new FormData();

            const dto = {
                providerId: id,
                type: docDialog.type,
                fileName: docDialog.fileName,
                // fileUrl will be generated by backend
                expiryDate: docDialog.expiryDate || null,
                notes: docDialog.notes,
                documentNumber: `DOC-${Date.now()}` // Or allow user input
            };

            formData.append('data', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

            if (docDialog.file) {
                formData.append('file', docDialog.file);
            }

            await providersService.addDocument(id, formData);
            enqueueSnackbar('تم إضافة المستند بنجاح', { variant: 'success' });
            setDocDialog({ open: false, type: 'LICENSE', expiryDate: '', notes: '', fileName: '', file: null });
            fetchDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            const errorMsg = error.response?.data?.message || error.technicalMessage || 'فشل إضافة المستند';
            enqueueSnackbar(`فشل إضافة المستند: ${errorMsg}`, { variant: 'error' });
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        // Legacy direct call replaced by dialog
    };

    const handlePreview = async (doc) => {
        try {
            if (!doc.fileUrl) {
                enqueueSnackbar('رابط الملف غير متوفر', { variant: 'error' });
                return;
            }

            // Cleanup old blob URL if exists
            if (previewDialog.url && previewDialog.url.startsWith('blob:')) {
                URL.revokeObjectURL(previewDialog.url);
            }

            setPreviewLoading(true);
            setPreviewDialog({ open: true, url: '', title: doc.fileName });

            const blob = await providersService.downloadDocument(doc.fileUrl);
            const objectUrl = URL.createObjectURL(blob);
            setPreviewDialog({ open: true, url: objectUrl, title: doc.fileName });
        } catch (error) {
            console.error('Preview error:', error);
            enqueueSnackbar('فشل تحميل الملف للمعاينة', { variant: 'error' });
            setPreviewDialog({ ...previewDialog, open: false });
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleConfirmDeleteDoc = async () => {
        if (!deleteDocDialog.docId) return;
        try {
            await providersService.deleteDocument(id, deleteDocDialog.docId);
            enqueueSnackbar('تم حذف المستند بنجاح', { variant: 'success' });
            fetchDocuments();
        } catch (error) {
            enqueueSnackbar('فشل حذف المستند', { variant: 'error' });
        } finally {
            setDeleteDocDialog({ open: false, docId: null });
        }
    };

    const handleChange = (field) => (event) => {
        setFormData({ ...formData, [field]: event.target.value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    const handleTabChange = (event, newValue) => setActiveTab(newValue);

    const handlePayerToggleRequest = (payer) => {
        setConfirmDialog({
            open: true,
            payerId: payer.id,
            action: payer.enabled ? 'disable' : 'enable',
            payerName: payer.name
        });
    };

    const handleConfirmToggle = async () => {
        // Here we should ideally call an API to create/suspend a contract
        // For now, we update the UI state and assume the user will click "Save" to persist changes
        // OR if the user wants "Instant" validation, we might need a separate API call here.
        // Given "Move control to Edit", simpler is to batch save, OR call toggle endpoint.
        // But to correct verify from DB, better to rely on what we loaded. 
        // For this UI interaction, we'll update local state and send the new "allowed list" or similar on Save.
        // WARNING: Real contract management is complex (dates, terms). 
        // We will treat this as a quick "Allow/Disallow" switch.

        const { payerId } = confirmDialog;
        setPayers(prev => prev.map(p => p.id === payerId ? { ...p, enabled: !p.enabled } : p));
        setConfirmDialog({ ...confirmDialog, open: false });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'اسم مقدم الخدمة مطلوب';
        if (!formData.licenseNumber) newErrors.licenseNumber = 'رقم الترخيص مطلوب';
        if (!formData.providerType) newErrors.providerType = 'نوع المزود مطلوب';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'البريد الإلكتروني غير صحيح';
        }
        setErrors(newErrors);

        if (newErrors.name || newErrors.licenseNumber) setActiveTab(0);
        else if (newErrors.email) setActiveTab(1);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        // Prepare payload
        // We include allowedPayers IDs/Codes if the backend supports updating them via this endpoint
        // If not, we might need a separate loop to create contracts for new ones.
        const payload = {
            ...formData,
            allowedPayers: payers.filter(p => p.enabled).map(p => p.id) // Send IDs of enabled payers
        };

        const result = await update(id, payload);

        if (result.success) {
            enqueueSnackbar('تم تحديث بيانات مقدم الخدمة وصلاحيات الشركاء بنجاح', { variant: 'success' });
            navigate('/providers');
        } else {
            enqueueSnackbar(result.error || 'فشل التحديث', { variant: 'error' });
        }
    };

    // Render Helpers
    const renderBasicInfo = () => (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Business color="primary" />
                <Typography variant="h5">البيانات الأساسية</Typography>
            </Box>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth required label="اسم مقدم الخدمة" value={formData.name}
                        onChange={handleChange('name')} error={!!errors.name} helperText={errors.name}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth required label="رقم الترخيص" value={formData.licenseNumber} disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="الرقم الضريبي" value={formData.taxNumber} onChange={handleChange('taxNumber')} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth required select label="نوع مقدم الخدمة" value={formData.providerType}
                        onChange={handleChange('providerType')} error={!!errors.providerType}
                    >
                        {PROVIDER_TYPES.map(op => <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth select label="حالة الشبكة" value={formData.networkStatus}
                        onChange={handleChange('networkStatus')}
                    >
                        {NETWORK_STATUS_OPTIONS.map(op => <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth select label="الحالة التشغيلية" value={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    >
                        <MenuItem value={true}>نشط</MenuItem>
                        <MenuItem value={false}>غير نشط</MenuItem>
                    </TextField>
                </Grid>
            </Grid>
        </Box>
    );

    const renderLocationContact = () => (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LocationOn color="primary" />
                <Typography variant="h5">الموقع والتواصل</Typography>
            </Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="المدينة" value={formData.city} onChange={handleChange('city')} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="العنوان" value={formData.address} onChange={handleChange('address')} multiline rows={1} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="رقم الهاتف" value={formData.phone} onChange={handleChange('phone')} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="البريد الإلكتروني" value={formData.email} onChange={handleChange('email')} error={!!errors.email} helperText={errors.email} />
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>معلومات العقد (للمرجعية)</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <TextField fullWidth type="date" label="بداية العقد" value={formData.contractStartDate} onChange={handleChange('contractStartDate')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField fullWidth type="date" label="نهاية العقد" value={formData.contractEndDate} onChange={handleChange('contractEndDate')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField fullWidth type="number" label="نسبة الخصم %" value={formData.defaultDiscountRate} onChange={handleChange('defaultDiscountRate')} />
                </Grid>
            </Grid>
        </Box>
    );

    const renderPartners = () => (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Handshake color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">صلاحيات شركات التأمين</Typography>
            </Box>
            {loadingPayers ? (
                <CircularProgress size={24} />
            ) : (
                <>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                        <Table stickyHeader>
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: 'grey.50' }}>شريك التأمين</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: 'grey.50' }}>الرمز</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: 'grey.50' }}>الحالة</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((payer) => (
                                    <TableRow key={payer.id} hover>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar sx={{ bgcolor: payer.enabled ? 'primary.main' : 'grey.300', color: '#fff' }}>{payer.logo}</Avatar>
                                                <Typography fontWeight={payer.enabled ? 'bold' : 'normal'}>{payer.name}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={payer.code} size="small" variant={payer.enabled ? "filled" : "outlined"} color={payer.enabled ? "primary" : "default"} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <FormControlLabel
                                                control={<Switch checked={payer.enabled} onChange={() => handlePayerToggleRequest(payer)} />}
                                                label={payer.enabled ? "مصرح به" : "محظور"}
                                                labelPlacement="start"
                                                sx={{ m: 0 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {rowsPerPage > 0 && payers.length > 0 && (
                                    <TableRow style={{ height: 73 * Math.max(0, rowsPerPage - Math.min(rowsPerPage, payers.length - page * rowsPerPage)) }}>
                                        <TableCell colSpan={3} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[3, 6, 9]}
                        component="div"
                        count={payers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage="صفوف لكل صفحة"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
                        showFirstButton showLastButton
                        sx={{
                            direction: 'ltr',
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            '& .MuiToolbar-root': { minHeight: 40, height: 40, pl: 2 },
                            '& .MuiTablePagination-actions': { marginLeft: 1 },
                            '& .MuiIconButton-root': { padding: '4px' },
                            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { m: 0 }
                        }}
                    />
                </>
            )}
        </Box>
    );

    const renderUsers = () => {
        // Determine active status: supporting both property names for safety
        const isUserActive = linkedUser && (linkedUser.active === true || linkedUser.enabled === true);

        return (
            <Box sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <People color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5">حساب إدارة النظام</Typography>
                </Box>

                {loadingUser ? <CircularProgress /> : linkedUser ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 3,
                            bgcolor: isUserActive ? 'success.lighter' : 'error.lighter',
                            borderColor: isUserActive ? 'success.light' : 'error.light'
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                            <Avatar sx={{ bgcolor: isUserActive ? 'success.main' : 'error.main' }}>
                                {isUserActive ? <CheckCircle /> : <Block />}
                            </Avatar>
                            <Box>
                                <Typography variant="h6">{isUserActive ? 'الحساب نشط' : 'الحساب متوقف'}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {isUserActive
                                        ? 'يوجد حساب مسؤول فعال مرتبط بمقدم الخدمة هذا'
                                        : 'تم إيقاف حساب المسؤول لهذا المزود، لن يتمكن من الدخول للنظام'}
                                </Typography>
                            </Box>
                        </Stack>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary">اسم الدخول</Typography>
                                <Typography variant="body1" fontWeight="bold">{linkedUser.username}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary">البريد الإلكتروني</Typography>
                                <Typography variant="body1">{linkedUser.email}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button variant="outlined" color="primary" startIcon={<VpnKey />} onClick={handleOpenResetPassword}>تغيير كلمة المرور</Button>
                                    <Button
                                        variant="outlined"
                                        color={isUserActive ? "error" : "success"}
                                        startIcon={isUserActive ? <Block /> : <CheckCircle />}
                                        onClick={handleToggleUserStatus}
                                    >
                                        {isUserActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                ) : (
                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            لا يوجد حالياً حساب دخول لهذا المزود. يجب إنشاء حساب واحد فقط للمسؤول عن إدارة بوابة الخدمة.
                        </Alert>

                        <Grid container spacing={3} maxWidth="sm">
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="اسم المستخدم"
                                    value={userForm.username}
                                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                    placeholder="مثال: admin_hospital"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Person /></InputAdornment>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    type={showPassword ? "text" : "password"}
                                    label="كلمة المرور"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    type={showPassword ? "text" : "password"}
                                    label="تأكيد كلمة المرور"
                                    value={userForm.confirmPassword}
                                    onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={handleCreateUser}
                                    disabled={!userForm.username || !userForm.password}
                                >
                                    إنشاء الحساب وتفعيل الدخول
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </Box>
        );
    };


    const renderDocuments = () => (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description color="primary" />
                    <Typography variant="h5">المستندات والمرفقات</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDocDialog({ ...docDialog, open: true })}>إضافة مستند</Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                يمكنك رفع صور الرخص، السجل التجاري، والشهادات الضريبية.
            </Alert>

            {loadingDocs ? <CircularProgress /> : (
                <>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                        <Table stickyHeader>
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell align="center">نوع المستند</TableCell>
                                    <TableCell align="center">اسم الملف</TableCell>
                                    <TableCell align="center">رقم المستند</TableCell>
                                    <TableCell align="center">الملاحظات</TableCell>
                                    <TableCell align="center">تاريخ الانتهاء</TableCell>
                                    <TableCell align="center">الإجراءات</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents.length > 0 ? documents
                                    .slice(docPage * docRowsPerPage, docPage * docRowsPerPage + docRowsPerPage)
                                    .map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell align="center">
                                                <Chip
                                                    label={DOC_TYPE_LABELS[doc.type] || doc.type}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center" dir="ltr">
                                                <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
                                                    <Description fontSize="small" color="action" />
                                                    <Typography variant="body2">{doc.fileName}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">{doc.documentNumber || '-'}</TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mx: 'auto' }}>
                                                    {doc.notes || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {doc.expiryDate ? (
                                                    <Chip
                                                        label={doc.expiryDate}
                                                        color={new Date(doc.expiryDate) < new Date() ? "error" : "success"}
                                                        size="small"
                                                    />
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" justifyContent="center" spacing={1}>
                                                    <Button
                                                        size="small"
                                                        startIcon={<Visibility />}
                                                        onClick={() => handlePreview(doc)}
                                                    >
                                                        معاينة
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => setDeleteDocDialog({ open: true, docId: doc.id })}
                                                    >
                                                        حذف
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="text.secondary">لا توجد مستندات مرفوعة حالياً</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[3, 6, 9]}
                        component="div"
                        count={documents.length}
                        rowsPerPage={docRowsPerPage}
                        page={docPage}
                        onPageChange={(e, newPage) => setDocPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setDocRowsPerPage(parseInt(e.target.value, 10));
                            setDocPage(0);
                        }}
                        labelRowsPerPage="صفوف لكل صفحة"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
                        showFirstButton
                        showLastButton
                        sx={{
                            direction: 'ltr',
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            '& .MuiToolbar-root': { minHeight: 40, height: 40, pl: 2 },
                            '& .MuiTablePagination-actions': { marginLeft: 1 },
                            '& .MuiIconButton-root': { padding: '4px' },
                            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { m: 0 }
                        }}
                    />
                </>
            )}

            {/* Preview Dialog */}
            <Dialog
                open={previewDialog.open}
                onClose={() => setPreviewDialog({ ...previewDialog, open: false })}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {previewDialog.title}
                    <IconButton onClick={() => setPreviewDialog({ ...previewDialog, open: false })}>
                        <Block />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: '80vh', overflow: 'hidden', bgcolor: 'grey.100', position: 'relative' }}>
                    {previewLoading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary">جاري تحميل المستند للمعاينة...</Typography>
                        </Box>
                    ) : (
                        <>
                            {previewDialog.url && (previewDialog.url.startsWith('http') || previewDialog.url.startsWith('/api/') || previewDialog.url.startsWith('blob:')) ? (
                                <iframe
                                    src={previewDialog.url}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="Document Preview"
                                />
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, p: 3, textAlign: 'center' }}>
                                    <Description sx={{ fontSize: 80, color: 'text.disabled' }} />
                                    <Typography variant="h6" color="text.secondary">
                                        المعاينة غير متوفرة
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                                        لا يمكن معاينة الملف <strong>{previewDialog.title}</strong> لأنه لم يتم رفعه فعلياً إلى الخادم.
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => window.open(previewDialog.url, '_blank')} startIcon={<Visibility />}>
                        فتح في نافذة جديدة
                    </Button>
                    <Button onClick={() => setPreviewDialog({ ...previewDialog, open: false })}>إغلاق</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDocDialog.open} onClose={() => setDeleteDocDialog({ open: false, docId: null })}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" /> حذف المستند
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        هل أنت متأكد من رغبتك في حذف هذا المستند؟ لا يمكن التراجع عن هذا الإجراء.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDocDialog({ open: false, docId: null })}>إلغاء</Button>
                    <Button onClick={handleConfirmDeleteDoc} variant="contained" color="error">حذف</Button>
                </DialogActions>
            </Dialog>

            {/* Add Document Dialog */}
            <Dialog open={docDialog.open} onClose={() => setDocDialog({ ...docDialog, open: false })}>
                <DialogTitle>إضافة مستند جديد</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 400 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            select
                            label="نوع المستند"
                            fullWidth
                            value={docDialog.type}
                            onChange={(e) => setDocDialog({ ...docDialog, type: e.target.value })}
                        >
                            <MenuItem value="LICENSE">رخصة مزاولة مهنة</MenuItem>
                            <MenuItem value="COMMERCIAL_REGISTER">سجل تجاري</MenuItem>
                            <MenuItem value="TAX_CERTIFICATE">شهادة ضريبية</MenuItem>
                            <MenuItem value="CONTRACT_COPY">نسخة العقد</MenuItem>
                            <MenuItem value="OTHER">أخرى</MenuItem>
                        </TextField>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            المرفق: مسموح فقط بملفات PDF أو صور (JPG, PNG) بحد أقصى 10 ميجا بايت.
                        </Typography>

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={docDialog.fileName ? <CheckCircle /> : <AddIcon />}
                            color={docDialog.fileName ? 'success' : 'primary'}
                            fullWidth
                            sx={{ height: 56, justifyContent: 'flex-start', px: 2, borderStyle: docDialog.fileName ? 'solid' : 'dashed' }}
                        >
                            {docDialog.fileName || 'اختر ملف PDF أو صورة...'}
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];

                                        // Validate size (10MB)
                                        if (file.size > 10 * 1024 * 1024) {
                                            enqueueSnackbar('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت', { variant: 'error' });
                                            e.target.value = null;
                                            return;
                                        }

                                        // Validate type
                                        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
                                        if (!allowedTypes.includes(file.type)) {
                                            enqueueSnackbar('نوع الملف غير مدعوم. يرجى رفع PDF أو صور فقط', { variant: 'error' });
                                            e.target.value = null;
                                            return;
                                        }

                                        setDocDialog({
                                            ...docDialog,
                                            fileName: file.name,
                                            file: file
                                        });
                                    }
                                }}
                            />
                        </Button>

                        <TextField
                            type="date"
                            label="تاريخ الانتهاء"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={docDialog.expiryDate}
                            onChange={(e) => setDocDialog({ ...docDialog, expiryDate: e.target.value })}
                        />

                        <TextField
                            label="ملاحظات"
                            fullWidth
                            multiline
                            rows={2}
                            value={docDialog.notes}
                            onChange={(e) => setDocDialog({ ...docDialog, notes: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDocDialog({ ...docDialog, open: false })}>إلغاء</Button>
                    <Button onClick={handleAddDocument} variant="contained">حفظ</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );

    if (loading) return <CircularProgress />;

    return (
        <>
            <ModernPageHeader
                title="تعديل بيانات مقدم الخدمة"
                subtitle={provider?.name || '...'}
                icon={ProviderIcon}
                breadcrumbs={[{ label: 'مقدمو الخدمات', path: '/providers' }, { label: 'تعديل' }]}
                actions={
                    <Stack direction="row" spacing={2}>
                        <Button startIcon={<ArrowBack />} onClick={() => navigate('/providers')} disabled={updating}>عودة</Button>
                        <RBACGuard requiredPermissions={[PERMISSIONS.MANAGE_PROVIDERS]}>
                            <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={updating}>
                                {updating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </Button>
                        </RBACGuard>
                    </Stack>
                }
            />

            <MainCard>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab icon={<Business />} label="البيانات الأساسية" iconPosition="start" />
                        <Tab icon={<LocationOn />} label="الموقع والتواصل" iconPosition="start" />
                        <Tab icon={<Handshake />} label="الصلاحيات والشركاء" iconPosition="start" />
                        <Tab icon={<People />} label="حسابات المستخدمين" iconPosition="start" />
                        <Tab icon={<Description />} label="المستندات" iconPosition="start" />
                    </Tabs>
                </Box>
                <Box sx={{ mb: 4, minHeight: 400 }}>
                    <Box hidden={activeTab !== 0}>{activeTab === 0 && renderBasicInfo()}</Box>
                    <Box hidden={activeTab !== 1}>{activeTab === 1 && renderLocationContact()}</Box>
                    <Box hidden={activeTab !== 2}>{activeTab === 2 && renderPartners()}</Box>
                    <Box hidden={activeTab !== 3}>{activeTab === 3 && renderUsers()}</Box>
                    <Box hidden={activeTab !== 4}>{activeTab === 4 && renderDocuments()}</Box>
                </Box>
            </MainCard>

            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" /> تحديد صلاحية استقبال البطاقات
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        هل تريد {confirmDialog.action === 'enable' ? 'السماح' : 'إيقاف'} لمقدم الخدمة باستقبال بطاقات <strong>{confirmDialog.payerName}</strong>؟
                        <br />
                        <small>يتم التحقق من هذه الصلاحية عند كل عملية استقبال مريض.</small>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>إلغاء</Button>
                    <Button onClick={handleConfirmToggle} variant="contained" color="primary">تأكيد</Button>
                </DialogActions>
            </Dialog>

            {/* Password Reset Dialog */}
            <Dialog open={resetPasswordDialog.open} onClose={() => setResetPasswordDialog({ ...resetPasswordDialog, open: false })}>
                <DialogTitle>تغيير كلمة المرور</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        يرجى إدخال كلمة المرور الجديدة للمستخدم <strong>{linkedUser?.username}</strong>.
                    </DialogContentText>
                    <Stack spacing={2}>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="كلمة المرور الجديدة"
                            type="password"
                            fullWidth
                            value={resetPasswordDialog.newPassword}
                            onChange={(e) => setResetPasswordDialog({ ...resetPasswordDialog, newPassword: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="تأكيد كلمة المرور"
                            type="password"
                            fullWidth
                            value={resetPasswordDialog.confirmPassword}
                            onChange={(e) => setResetPasswordDialog({ ...resetPasswordDialog, confirmPassword: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetPasswordDialog({ ...resetPasswordDialog, open: false })}>إلغاء</Button>
                    <Button
                        onClick={handleSubmitResetPassword}
                        variant="contained"
                        color="primary"
                        disabled={!resetPasswordDialog.newPassword || resetPasswordDialog.newPassword !== resetPasswordDialog.confirmPassword}
                    >
                        تغيير كلمة المرور
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ProviderEdit;
