import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import { Iconify } from 'src/components/iconify';

const NAV_ITEMS = [
  { path: '/', label: 'nav.editor', icon: 'solar:pen-bold' },
  { path: '/history', label: 'nav.history', icon: 'solar:clock-circle-bold' },
  { path: '/balance', label: 'nav.balance', icon: 'solar:wad-of-money-bold' },
] as const;

export function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_, newValue) => navigate(newValue)}
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            py: 1,
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.path}
            value={item.path}
            label={t(item.label)}
            icon={<Iconify icon={item.icon} width={24} />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
