import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useStore } from 'src/store/store';
import { CONFIG } from 'src/global-config';

const TOP_UP_AMOUNTS = [100, 300, 500, 1000];

export function BalancePage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const user = useStore((state) => state.user);

  const handleTopUp = (amount: number) => {
    enqueueSnackbar(`Payment for ${amount} RUB - coming soon!`, { variant: 'info' });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {t('balance.title')}
      </Typography>

      <Box
        sx={[
          (theme) => ({
            p: 5,
            borderRadius: 2,
            position: 'relative',
            color: 'common.white',
            mb: 3,
            textAlign: 'center',
            backgroundImage: `linear-gradient(135deg, ${theme.vars.palette.primary.main}, ${theme.vars.palette.primary.dark})`,
          }),
        ]}
      >
        <Box
          component="img"
          alt="Invite"
          src={`${CONFIG.assetsDir}/assets/illustrations/illustration-receipt.webp`}
          sx={{
            zIndex: 9,
            width: 128,
            height: 128,
          }}
        />
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
          {t('balance.current')}
        </Typography>
        <Typography variant="h3" fontWeight="bold">
          {t('balance.amount', { amount: (user?.balance || 0).toFixed(2) })}
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('balance.topUp')}
      </Typography>

      <Grid container spacing={2}>
        {TOP_UP_AMOUNTS.map((amount) => (
          <Grid key={amount} size={{ xs: 6 }}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => handleTopUp(amount)}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              {amount} RUB
            </Button>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
