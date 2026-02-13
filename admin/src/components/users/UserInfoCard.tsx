import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { UserDetail } from '../../types';

dayjs.extend(relativeTime);

interface UserInfoCardProps {
  user: UserDetail;
  onUpdateBalance: (amount: number, reason: string) => Promise<void>;
  onToggleBlock: () => Promise<void>;
}

export default function UserInfoCard({ user, onUpdateBalance, onToggleBlock }: UserInfoCardProps) {
  const navigate = useNavigate();
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleUpdateBalance = async () => {
    if (!balanceAmount) return;
    setLoading(true);
    try {
      await onUpdateBalance(parseFloat(balanceAmount), balanceReason);
      setBalanceDialogOpen(false);
      setBalanceAmount('');
      setBalanceReason('');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    setLoading(true);
    try {
      await onToggleBlock();
      setBlockDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const infoItems = [
    { label: 'Telegram ID', value: user.telegramId, copyable: true },
    { label: 'Username', value: user.username ? `@${user.username}` : '-' },
    { label: 'Name', value: [user.firstName, user.lastName].filter(Boolean).join(' ') || '-' },
    { label: 'Language', value: user.languageCode },
    { label: 'Referral Code', value: user.referralCode || '-' },
    { label: 'Registered', value: dayjs(user.createdAt).format('DD.MM.YYYY HH:mm') },
    { label: 'Last Active', value: user.lastActiveAt ? dayjs(user.lastActiveAt).fromNow() : '-' },
    { label: 'Generations', value: user._count?.generations?.toString() || '0' },
    { label: 'Transactions', value: user._count?.transactions?.toString() || '0' },
  ];

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/users')}
                size="small"
              >
                Back
              </Button>
              <Typography variant="h5">
                User Details
              </Typography>
              <Chip
                label={user.isBlocked ? 'Blocked' : 'Active'}
                color={user.isBlocked ? 'error' : 'success'}
                size="small"
              />
              {user.isAdmin && (
                <Chip label="Admin" color="primary" size="small" />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={() => setBalanceDialogOpen(true)}
                size="small"
              >
                Change Balance
              </Button>
              <Button
                variant="outlined"
                color={user.isBlocked ? 'success' : 'error'}
                startIcon={user.isBlocked ? <CheckCircleIcon /> : <BlockIcon />}
                onClick={() => setBlockDialogOpen(true)}
                size="small"
              >
                {user.isBlocked ? 'Unblock' : 'Block'}
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="h4" color="primary">
              ${user.balance?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Balance
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {infoItems.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body1">
                      {item.value}
                    </Typography>
                    {item.copyable && item.value !== '-' && (
                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={() => handleCopy(String(item.value))}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Balance Dialog */}
      <Dialog open={balanceDialogOpen} onClose={() => setBalanceDialogOpen(false)}>
        <DialogTitle>Change Balance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Current balance: ${user.balance?.toFixed(2) || '0.00'}
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
            disabled={!balanceAmount || loading}
          >
            Update Balance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>
          {user.isBlocked ? 'Unblock User' : 'Block User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {user.isBlocked ? 'unblock' : 'block'} this user?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleToggleBlock}
            variant="contained"
            color={user.isBlocked ? 'success' : 'error'}
            disabled={loading}
          >
            {user.isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
