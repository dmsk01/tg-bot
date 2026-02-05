import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import { useStore } from '../../store/store';
import type { Promocode } from '../../types';
import dayjs from 'dayjs';

const PROMOCODE_TYPE_LABELS: Record<string, string> = {
  FIXED_AMOUNT: 'Fixed $',
  PERCENTAGE: '%',
  BONUS_CREDITS: 'Credits',
};

export default function PromocodesListPage() {
  const navigate = useNavigate();
  const promocodes = useStore((state) => state.promocodes);
  const pagination = useStore((state) => state.promocodesPagination);
  const isLoading = useStore((state) => state.promocodesLoading);
  const fetchPromocodes = useStore((state) => state.fetchPromocodes);
  const deletePromocode = useStore((state) => state.deletePromocode);
  const revokePromocode = useStore((state) => state.revokePromocode);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPromocode, setSelectedPromocode] = useState<Promocode | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double fetch in StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchPromocodes(paginationModel.page + 1, paginationModel.pageSize, search ? { search } : undefined);

    return () => {
      fetchedRef.current = false;
    };
  }, [paginationModel.page, paginationModel.pageSize, search, fetchPromocodes]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, promocode: Promocode) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedPromocode(promocode);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    if (selectedPromocode) {
      navigate(`/promocodes/${selectedPromocode.id}`);
    }
    handleMenuClose();
  };

  const handleRevoke = async () => {
    if (selectedPromocode) {
      await revokePromocode(selectedPromocode.id);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedPromocode) {
      await deletePromocode(selectedPromocode.id);
    }
    setDeleteDialogOpen(false);
  };

  const formatValue = (type: string, value: number) => {
    switch (type) {
      case 'FIXED_AMOUNT':
        return `$${value.toFixed(2)}`;
      case 'PERCENTAGE':
        return `${value}%`;
      case 'BONUS_CREDITS':
        return `${value} credits`;
      default:
        return value;
    }
  };

  const columns: GridColDef<Promocode>[] = [
    {
      field: 'code',
      headerName: 'Code',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={PROMOCODE_TYPE_LABELS[params.value] || params.value}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 120,
      renderCell: (params) => formatValue(params.row.type, params.value),
    },
    {
      field: 'usages',
      headerName: 'Usages',
      width: 120,
      valueGetter: (_, row) => {
        const used = row._count?.usages || 0;
        const max = row.maxUsages;
        return max ? `${used}/${max}` : used;
      },
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => {
        const isExpired = params.row.expiresAt && new Date(params.row.expiresAt) < new Date();
        return (
          <Chip
            label={!params.value ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
            size="small"
            color={!params.value ? 'error' : isExpired ? 'warning' : 'success'}
          />
        );
      },
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 120,
      valueFormatter: (value) => value ? dayjs(value).format('DD.MM.YYYY') : 'Never',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueFormatter: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row)}>
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Promocodes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/promocodes/create')}
        >
          Create Promocode
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Search by code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={promocodes}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={pagination?.total || 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Actions Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          Edit
        </MenuItem>
        {selectedPromocode?.isActive && (
          <MenuItem onClick={handleRevoke}>
            <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
            Revoke
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Promocode</DialogTitle>
        <DialogContent>
          Are you sure you want to delete promocode <strong>{selectedPromocode?.code}</strong>?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
