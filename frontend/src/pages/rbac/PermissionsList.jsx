import { useState, useMemo } from 'react';
import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    TextField,
    InputAdornment
} from '@mui/material';
import { Search as SearchIcon, VpnKey as VpnKeyIcon } from '@mui/icons-material';
import ModernPageHeader from 'components/tba/ModernPageHeader';
import useFetch from 'hooks/useFetch';
// Use rbacService to get permissions. 
// Assuming rbacService.getPermissions() or similar exists or we use getPermissionMatrix and extract unique permissions.
// If getPermissions doesn't exist, we can use getPermissionMatrix temporarily.
import { rbacService } from 'services/api';

const PermissionsList = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // We fetch the matrix because it contains all permissions grouped by category
    const { data: matrix, loading, error } = useFetch(() => rbacService.getPermissionMatrix());

    const permissions = useMemo(() => {
        if (!matrix?.categories) return [];

        let allPerms = [];
        // Flatten permissions from categories (List of DTOs)
        if (Array.isArray(matrix.categories)) {
            matrix.categories.forEach(category => {
                if (Array.isArray(category.permissions)) {
                    category.permissions.forEach(perm => {
                        allPerms.push({
                            ...perm,
                            category: category.nameAr || category.name // Use Arabic name if available
                        });
                    });
                }
            });
        }
        return allPerms;
    }, [matrix]);

    const filteredPermissions = useMemo(() => {
        return permissions.filter(p =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [permissions, searchTerm]);

    return (
        <Box sx={{ p: 3 }}>
            <ModernPageHeader
                title="قائمة الصلاحيات"
                subtitle="عرض جميع الصلاحيات المعرفة في النظام"
                icon={<VpnKeyIcon fontSize="large" color="primary" />}
            />

            <Card sx={{ p: 3 }}>
                <Box sx={{ mb: 3, maxWidth: 500 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="بحث عن صلاحية..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>الصلاحية</TableCell>
                                <TableCell>الرمز (Code)</TableCell>
                                <TableCell>التصنيف</TableCell>
                                <TableCell>الوصف</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPermissions.length > 0 ? (
                                filteredPermissions.map((perm) => (
                                    <TableRow key={perm.code || perm.id}>
                                        <TableCell>
                                            <Typography variant="subtitle2">{perm.name}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={perm.code} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={perm.category}
                                                size="small"
                                                color="primary"
                                                variant="filled"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell color="text.secondary">
                                            {perm.description || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Typography sx={{ py: 3, color: 'text.secondary' }}>
                                            {loading ? 'جاري التحميل...' : 'لا توجد صلاحيات لعرضها'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
};

export default PermissionsList;
