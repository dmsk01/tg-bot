import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useStore } from '../../store/store';
import { paths } from '../../routes/paths';
import type { User } from '../../types';
import dayjs from 'dayjs';

export default function UsersListPage() {
  const navigate = useNavigate();
  const users = useStore((state) => state.users);
  const pagination = useStore((state) => state.usersPagination);
  const isLoading = useStore((state) => state.usersLoading);
  const fetchUsers = useStore((state) => state.fetchUsers);
  const updateUserBalance = useStore((state) => state.updateUserBalance);

  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const fetchedRef = useRef(false);

  // Balance dialog state
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');

  useEffect(() => {
    // Prevent double fetch in StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchUsers(paginationModel.page + 1, paginationModel.pageSize, search || undefined);

    return () => {
      fetchedRef.current = false;
    };
  }, [paginationModel.page, paginationModel.pageSize, search, fetchUsers]);

  const handleOpenBalanceDialog = (user: User) => {
    setSelectedUser(user);
    setBalanceAmount('');
    setBalanceReason('');
    setBalanceDialogOpen(true);
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser || !balanceAmount) return;

    try {
      await updateUserBalance(selectedUser.id, parseFloat(balanceAmount), balanceReason);
      setBalanceDialogOpen(false);
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const columns: GridColDef<User>[] = [
    {
      field: 'telegramId',
      headerName: 'Telegram ID',
      width: 130,
    },
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
      renderCell: (params) => params.value ? `@${params.value}` : '-',
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 180,
      valueGetter: (_, row) => [row.firstName, row.lastName].filter(Boolean).join(' ') || '-',
    },
    {
      field: 'balance',
      headerName: 'Balance',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`$${params.value?.toFixed(2) || '0.00'}`}
          size="small"
          color={params.value > 0 ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'isBlocked',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Blocked' : 'Active'}
          size="small"
          color={params.value ? 'error' : 'success'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Registered',
      width: 120,
      valueFormatter: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(paths.users.detail(params.row.id));
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit balance">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenBalanceDialog(params.row);
              }}
            >
              <AccountBalanceWalletIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Search by username, name, or Telegram ID..."
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
          rows={users}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={pagination?.total || 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(paths.users.detail(params.row.id))}
          sx={{ cursor: 'pointer' }}
        />
      </Paper>

      {/* Balance Dialog */}
      <Dialog open={balanceDialogOpen} onClose={() => setBalanceDialogOpen(false)}>
        <DialogTitle>
          Edit Balance: {selectedUser?.username || selectedUser?.firstName || 'User'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Current balance: ${selectedUser?.balance?.toFixed(2) || '0.00'}
          </Typography>
          <TextField
            label="Amount (+ to add, - to subtract)"
            type="number"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Reason"
            value={balanceReason}
            onChange={(e) => setBalanceReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBalanceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateBalance}
            variant="contained"
            disabled={!balanceAmount}
          >
            Update Balance
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
