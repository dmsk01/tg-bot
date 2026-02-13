import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import ExportButton from './ExportButton';
import type { Generation, ExportFormat, PaginatedResponse } from '../../types';

interface UserGenerationsTabProps {
  generations: Generation[];
  pagination: PaginatedResponse<Generation>['pagination'] | null;
  loading: boolean;
  onPaginationChange: (page: number, limit: number) => void;
  onExport: (format: ExportFormat) => Promise<void>;
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  PENDING: 'default',
  QUEUED: 'info',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  FAILED: 'error',
  MODERATED: 'warning',
};

const typeLabels: Record<string, string> = {
  TEXT_TO_IMAGE: 'Text to Image',
  IMAGE_TO_IMAGE: 'Image to Image',
  INPAINTING: 'Inpainting',
};

export default function UserGenerationsTab({
  generations,
  pagination,
  loading,
  onPaginationChange,
  onExport,
}: UserGenerationsTabProps) {
  const columns: GridColDef<Generation>[] = [
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 140,
      valueFormatter: (value) => dayjs(value).format('DD.MM.YY HH:mm'),
    },
    {
      field: 'generationType',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => typeLabels[params.value] || params.value,
    },
    {
      field: 'model',
      headerName: 'Model',
      width: 150,
    },
    {
      field: 'prompt',
      headerName: 'Prompt',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      ),
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
    {
      field: 'cost',
      headerName: 'Cost',
      width: 80,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'resultUrl',
      headerName: 'Preview',
      width: 80,
      renderCell: (params) =>
        params.value ? (
          <Box
            component="img"
            src={params.value}
            alt="Preview"
            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
          />
        ) : (
          '-'
        ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ExportButton onExport={onExport} disabled={loading || !generations.length} />
      </Box>
      <DataGrid
        rows={generations}
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
