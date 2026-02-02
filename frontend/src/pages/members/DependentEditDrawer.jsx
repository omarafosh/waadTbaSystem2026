import { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    Stack,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    IconButton,
    CircularProgress,
    Divider,

    Grid,
    FormControlLabel,
    Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { updateMember, uploadPhoto, GENDERS, RELATIONSHIPS } from 'services/api/unified-members.service';
import { RELATIONSHIP_AR } from './UnifiedMemberView';
import { openSnackbar } from 'api/snackbar';

const DependentEditDrawer = ({ open, onClose, dependent, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        nationalNumber: '',
        birthDate: null,
        gender: '',
        relationship: '',
        nationality: 'ليبي',
        active: true,
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (dependent && open) {
            setFormData({
                fullName: dependent.fullName || '',
                nationalNumber: dependent.nationalNumber || '',
                birthDate: dependent.birthDate ? dayjs(dependent.birthDate) : null,
                gender: dependent.gender || '',
                relationship: dependent.relationship || '',
                nationality: dependent.nationality || 'ليبي',
                active: dependent.status === 'ACTIVE',
            });
            setPhotoPreview(dependent.photoUrl || null); // Assuming photoUrl is available or undefined
            setPhoto(null);
            setErrors({});
        }
    }, [dependent, open]);

    const handleChange = (field) => (event) => {
        setFormData({ ...formData, [field]: event.target.value });
        if (errors[field]) setErrors({ ...errors, [field]: null });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, birthDate: date });
        if (errors.birthDate) setErrors({ ...errors, birthDate: null });
    };

    const handleActiveChange = (event) => {
        setFormData({ ...formData, active: event.target.checked });
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'الاسم مطلوب';
        if (!formData.birthDate) newErrors.birthDate = 'التاريخ مطلوب';
        if (!formData.gender) newErrors.gender = 'الجنس مطلوب';
        if (!formData.relationship) newErrors.relationship = 'القرابة مطلوبة';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            const payload = {
                fullName: formData.fullName.trim(),
                nationalNumber: formData.nationalNumber?.trim() || null,
                birthDate: formData.birthDate ? dayjs(formData.birthDate).format('YYYY-MM-DD') : null,
                gender: formData.gender,
                relationship: formData.relationship,
                nationality: formData.nationality,
                status: formData.active ? 'ACTIVE' : 'SUSPENDED',
            };

            await updateMember(dependent.id, payload);

            if (photo) {
                await uploadPhoto(dependent.id, photo);
            }

            openSnackbar({
                open: true,
                message: 'تم تحديث البيانات بنجاح',
                variant: 'alert',
                alert: { color: 'success' }
            });

            onSave(); // Refresh list
            onClose();

        } catch (error) {
            console.error('Error updating dependent:', error);
            openSnackbar({
                open: true,
                message: error.response?.data?.message || 'خطأ في تحديث البيانات',
                variant: 'alert',
                alert: { color: 'error' }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: { xs: '100%', sm: 400 }, p: 3 }
            }}
        >
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">تعديل بيانات التابع</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Stack>

                <Divider />

                <Box display="flex" justifyContent="center">
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="drawer-photo-upload"
                        type="file"
                        onChange={handlePhotoChange}
                    />
                    <label htmlFor="drawer-photo-upload">
                        <Box position="relative" sx={{ cursor: 'pointer', '&:hover .overlay': { opacity: 1 } }}>
                            <Avatar
                                src={photoPreview}
                                sx={{ width: 100, height: 100, border: '1px solid', borderColor: 'divider' }}
                            >
                                <PersonIcon sx={{ fontSize: 60 }} />
                            </Avatar>
                            <Box
                                className="overlay"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <CloudUploadIcon sx={{ color: 'white' }} />
                            </Box>
                        </Box>
                    </label>
                </Box>

                <Stack spacing={2}>
                    <TextField
                        label="الاسم الكامل"
                        fullWidth
                        value={formData.fullName}
                        onChange={handleChange('fullName')}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                    />

                    <FormControl fullWidth error={!!errors.relationship}>
                        <InputLabel>القرابة</InputLabel>
                        <Select
                            value={formData.relationship}
                            onChange={handleChange('relationship')}
                            label="القرابة"
                        >
                            {Object.entries(RELATIONSHIPS).map(([key, value]) => (
                                <MenuItem key={key} value={value}>
                                    {RELATIONSHIP_AR[value] || value}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth error={!!errors.gender}>
                        <InputLabel>الجنس</InputLabel>
                        <Select
                            value={formData.gender}
                            onChange={handleChange('gender')}
                            label="الجنس"
                        >
                            {Object.entries(GENDERS).map(([key, value]) => (
                                <MenuItem key={key} value={value}>
                                    {value === 'MALE' ? 'ذكر' : value === 'FEMALE' ? 'أنثى' : 'غير محدد'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <DatePicker
                        label="تاريخ الميلاد"
                        value={formData.birthDate}
                        onChange={handleDateChange}
                        maxDate={dayjs()}
                        slotProps={{ textField: { fullWidth: true, error: !!errors.birthDate, helperText: errors.birthDate } }}
                    />

                    <TextField
                        label="الرقم الوطني"
                        fullWidth
                        value={formData.nationalNumber}
                        onChange={handleChange('nationalNumber')}
                    />
                    <TextField
                        label="الجنسية"
                        fullWidth
                        value={formData.nationality}
                        onChange={handleChange('nationality')}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.active}
                                onChange={handleActiveChange}
                                color="success"
                            />
                        }
                        label={formData.active ? 'نشط' : 'غير نشط'}
                    />
                </Stack>

                <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        حفظ التعديلات
                    </Button>
                </Box>
            </Stack>
        </Drawer>
    );
};

export default DependentEditDrawer;
