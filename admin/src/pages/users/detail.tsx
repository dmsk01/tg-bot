import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Tab, Tabs, CircularProgress, Alert } from '@mui/material';
import { useStore } from '../../store/store';
import UserInfoCard from '../../components/users/UserInfoCard';
import UserGenerationsTab from '../../components/users/UserGenerationsTab';
import UserTransactionsTab from '../../components/users/UserTransactionsTab';
import UserLogsTab from '../../components/users/UserLogsTab';
import type { ExportFormat } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);

  const {
    currentUser,
    userGenerations,
    userGenerationsPagination,
    userTransactions,
    userTransactionsPagination,
    userLogs,
    userLogsPagination,
    userDetailLoading,
    userDetailError,
    fetchUserDetail,
    fetchUserGenerations,
    fetchUserTransactions,
    fetchUserLogs,
    updateCurrentUserBalance,
    toggleUserBlock,
    exportUserData,
    clearUserDetail,
  } = useStore();

  useEffect(() => {
    if (id) {
      fetchUserDetail(id);
      fetchUserGenerations(id);
      fetchUserTransactions(id);
      fetchUserLogs(id);
    }

    return () => {
      clearUserDetail();
    };
  }, [id, fetchUserDetail, fetchUserGenerations, fetchUserTransactions, fetchUserLogs, clearUserDetail]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleUpdateBalance = async (amount: number, reason: string) => {
    if (id) {
      await updateCurrentUserBalance(id, amount, reason);
    }
  };

  const handleToggleBlock = async () => {
    if (id) {
      await toggleUserBlock(id);
    }
  };

  const handleGenerationsPaginationChange = (page: number, limit: number) => {
    if (id) {
      fetchUserGenerations(id, page, limit);
    }
  };

  const handleTransactionsPaginationChange = (page: number, limit: number) => {
    if (id) {
      fetchUserTransactions(id, page, limit);
    }
  };

  const handleLogsPaginationChange = (page: number, limit: number) => {
    if (id) {
      fetchUserLogs(id, page, limit);
    }
  };

  const handleExportGenerations = async (format: ExportFormat) => {
    if (id) {
      await exportUserData(id, 'generations', format);
    }
  };

  const handleExportTransactions = async (format: ExportFormat) => {
    if (id) {
      await exportUserData(id, 'transactions', format);
    }
  };

  const handleExportLogs = async (format: ExportFormat) => {
    if (id) {
      await exportUserData(id, 'logs', format);
    }
  };

  if (userDetailLoading && !currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (userDetailError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {userDetailError}
      </Alert>
    );
  }

  if (!currentUser) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        User not found
      </Alert>
    );
  }

  return (
    <Box>
      <UserInfoCard
        user={currentUser}
        onUpdateBalance={handleUpdateBalance}
        onToggleBlock={handleToggleBlock}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={handleTabChange} aria-label="user detail tabs">
          <Tab label="Generations" {...a11yProps(0)} />
          <Tab label="Transactions" {...a11yProps(1)} />
          <Tab label="Action History" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <UserGenerationsTab
          generations={userGenerations}
          pagination={userGenerationsPagination}
          loading={userDetailLoading}
          onPaginationChange={handleGenerationsPaginationChange}
          onExport={handleExportGenerations}
        />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <UserTransactionsTab
          transactions={userTransactions}
          pagination={userTransactionsPagination}
          loading={userDetailLoading}
          onPaginationChange={handleTransactionsPaginationChange}
          onExport={handleExportTransactions}
        />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <UserLogsTab
          logs={userLogs}
          pagination={userLogsPagination}
          loading={userDetailLoading}
          onPaginationChange={handleLogsPaginationChange}
          onExport={handleExportLogs}
        />
      </TabPanel>
    </Box>
  );
}
