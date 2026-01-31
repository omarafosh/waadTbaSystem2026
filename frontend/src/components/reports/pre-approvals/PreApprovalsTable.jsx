import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import PreAuthStatusChip from './PreAuthStatusChip';
import { formatCurrency } from 'utils/formatters';

/**
 * PreApprovalsTable Component
 *
 * Displays pre-approvals in a paginated data grid
 */
const PreApprovalsTable = ({ preApprovals, loading, totalCount, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
  const columns = [
    {
      field: 'referenceNumber',
      headerName: 'رقم المرجع',
      width: 150,
      renderCell: (params) => <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
    },
    {
      field: 'memberName',
      headerName: 'المستفيد',
      width: 200
    },
    {
      field: 'employerName',
      headerName: 'الشريك',
      width: 200
    },
    {
      field: 'providerName',
      headerName: 'مقدم الخدمة',
      width: 200
    },
    {
      field: 'serviceName',
      headerName: 'الخدمة الطبية',
      width: 200
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 150,
      renderCell: (params) => <PreAuthStatusChip status={params.value} />
    },
    {
      field: 'requestedAmount',
      headerName: 'المبلغ المطلوب',
      width: 130,
      type: 'number',
      renderCell: (params) => <Typography variant="body2">{formatCurrency(params.value)}</Typography>
    },
    {
      field: 'approvedAmount',
      headerName: 'المبلغ المعتمد',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value != null ? formatCurrency(params.value) : '—'}</Typography>
      )
    },
    {
      field: 'requestDate',
      headerName: 'تاريخ الطلب',
      width: 130,
      renderCell: (params) => {
        if (!params.value) return '—';
        try {
          return new Date(params.value).toLocaleDateString('ar-SA');
        } catch {
          return params.value;
        }
      }
    },
    {
      field: 'validUntil',
      headerName: 'صالح حتى',
      width: 130,
      renderCell: (params) => {
        if (!params.value) return '—';
        try {
          return new Date(params.value).toLocaleDateString('ar-SA');
        } catch {
          return params.value;
        }
      }
    }
  ];

  // Empty state
  if (!loading && preApprovals.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        لا توجد موافقات مسبقة متاحة حاليًا
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={preApprovals}
        columns={columns}
        loading={loading}
        pagination
        paginationMode="client"
        page={page}
        pageSize={rowsPerPage}
        onPageChange={onPageChange}
        onPageSizeChange={onRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50, 100]}
        rowCount={totalCount}
        disableSelectionOnClick
        autoHeight
        components={{
          LoadingOverlay: LinearProgress
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            fontSize: '0.875rem'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'primary.lighter',
            fontWeight: 600
          }
        }}
      />
    </Box>
  );
};

PreApprovalsTable.propTypes = {
  preApprovals: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  totalCount: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired
};

PreApprovalsTable.defaultProps = {
  loading: false
};

export default PreApprovalsTable;
