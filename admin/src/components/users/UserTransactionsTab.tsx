import { Box, Chip, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import ExportButton from './ExportButton';
import type { Transaction, ExportFormat, PaginatedResponse } from '../../types';

interface UserTransactionsTabProps {
  transactions: Transaction[];
  pagination: PaginatedResponse<Transaction>['pagination'] | null;
  loading: boolean;
  onPaginationChange: (page: number, limit: number) => void;
  onExport: (format: ExportFormat) => Promise<void>;
}

const typeColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  DEPOSIT: 'success',
  WITHDRAWAL: 'error',
  REFUND: 'info',
  BONUS: 'primary',
};

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

export default function UserTransactionsTab({
  transactions,
  pagination,
  loading,
  onPaginationChange,
  onExport,
}: UserTransactionsTabProps) {
  const columns: GridColDef<Transaction>[] = [
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 140,
      valueFormatter: (value) => dayjs(value).format('DD.MM.YY HH:mm'),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={typeColors[params.value] || 'default'}
        />
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      renderCell: (params) => {
        const isPositive = params.row.type === 'DEPOSIT' || params.row.type === 'BONUS' || params.row.type === 'REFUND';
        return (
          <Typography
            variant="body2"
            color={isPositive ? 'success.main' : 'error.main'}
            fontWeight="bold"
          >
            {isPositive ? '+' : '-'}${Number(params.value).toFixed(2)}
          </Typography>
        );
      },
    },
    {
      field: 'balanceBefore',
      headerName: 'Before',
      width: 100,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'balanceAfter',
      headerName: 'After',
      width: 100,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={statusColors[params.value] || 'default'}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ExportButton onExport={onExport} disabled={loading || !transactions.length} />
      </Box>
      <DataGrid
        rows={transactions}
        columns={columns}
        loading={loading}
        paginationMode="server"
        rowCount={pagination?.total || 0}
        paginationModel={{
          page: (pagination?.page || 1) - 1,
          pageSize: pagination?.limit || 20,
        }}
        onPaginationModelChange={(model) => onPaginationChange(model.page + 1, model.pageSize)}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        autoHeight
        sx={{ minHeight: 400 }}
      />
    </Box>
  );
}
