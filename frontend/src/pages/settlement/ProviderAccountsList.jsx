import { useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Stack
} from '@mui/material';
import {
    AccountBalanceWallet as AccountIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { ModernPageHeader } from 'components/tba';
import MainCard from 'components/MainCard';
import GenericDataTable from 'components/GenericDataTable';
import useTableState from 'hooks/useTableState';
import { settlementService } from 'services/api';
import useApi from 'hooks/useApi';

const ProviderAccountsList = () => {
    const tableState = useTableState({
        initialPageSize: 10
    });

    const { data, isLoading } = useApi(
        () => settlementService.getProviderAccounts({
            page: tableState.page + 1,
            size: tableState.pageSize,
            search: tableState.search
        }),
        [tableState.page, tableState.pageSize, tableState.search]
    );

    const columns = useMemo(() => [
        { accessorKey: 'id', header: '#', size: 60 },
        { accessorKey: 'providerName', header: 'مقدم الخدمة', size: 200 },
        {
            accessorKey: 'balance',
            header: 'الرصيد الكلي',
            size: 150,
            cell: ({ getValue }) => (
                <Typography fontWeight="bold" color={getValue() > 0 ? 'success.main' : 'text.primary'}>
                    {getValue()?.toLocaleString()} د.ل
                </Typography>
            )
        },
        {
            accessorKey: 'totalPaid',
            header: 'إجمالي المدفوعات',
            size: 150,
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.toLocaleString()} د.ل
                </Typography>
            )
        },
        {
            accessorKey: 'lastTransactionDate',
            header: 'آخر حركة',
            size: 150,
            cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString('ar-SA') : '-'
        }
    ], []);

    return (
        <Box>
            <ModernPageHeader
                title="حسابات مقدمي الخدمة"
                subtitle="عرض الأرصدة والعمليات المالية لمقدمي الخدمة"
                icon={<AccountIcon />}
            />

            <MainCard content={false}>
                <GenericDataTable
                    data={data?.items || []}
                    columns={columns}
                    totalCount={data?.total || 0}
                    tableState={tableState}
                    isLoading={isLoading}
                    emptyMessage="لا توجد حسابات"
                />
            </MainCard>
        </Box>
    );
};

export default ProviderAccountsList;
