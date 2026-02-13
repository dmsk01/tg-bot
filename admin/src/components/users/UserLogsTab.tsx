import { Box, Tooltip, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import ExportButton from './ExportButton';
import type { AdminLog, ExportFormat, PaginatedResponse } from '../../types';

interface UserLogsTabProps {
  logs: AdminLog[];
  pagination: PaginatedResponse<AdminLog>['pagination'] | null;
  loading: boolean;
  onPaginationChange: (page: number, limit: number) => void;
  onExport: (format: ExportFormat) => Promise<void>;
}

const actionLabels: Record<string, string> = {
  UPDATE_USER: 'Updated User',
  CHANGE_BALANCE: 'Changed Balance',
  DELETE_USER: 'Blocked User',
  CREATE_USER: 'Created User',
};

export default function UserLogsTab({
  logs,
  pagination,
  loading,
  onPaginationChange,
  onExport,
}: UserLogsTabProps) {
  const columns: GridColDef<AdminLog>[] = [
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      valueFormatter: (value) => dayjs(value).format('DD.MM.YY HH:mm:ss'),
    },
    {
      field: 'admin',
      headerName: 'Admin',
      width: 150,
      valueGetter: (_, row) => row.admin?.username || '-',
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: (params) => actionLabels[params.value] || params.value,
    },
    {
      field: 'details',
      headerName: 'Details',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const details = params.value;
        if (!details) return '-';

        const text = typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details);

        return (
          <Tooltip title={<pre style={{ margin: 0 }}>{text}</pre>}>
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {JSON.stringify(details)}
            </Typography>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ExportButton onExport={onExport} disabled={loading || !logs.length} />
      </Box>
      <DataGrid
        rows={logs}
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
