import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { useStore } from 'src/store/store';

export function Header() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="bold">
          {t('app.title')}
        </Typography>
        {user && (
          <Chip
            label={t('balance.amount', { amount: user.balance.toFixed(2) })}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
      </Toolbar>
    </AppBar>
  );
}
