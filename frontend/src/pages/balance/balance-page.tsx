import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/global-config';
import { useStore } from 'src/store/store';
import { apiService } from 'src/services/api.service';

const DEFAULT_AMOUNTS = [100, 300, 500, 1000];

export function BalancePage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const user = useStore((state) => state.user);
  const refreshBalance = useStore((state) => state.refreshBalance);

  const [amounts, setAmounts] = useState<number[]>(DEFAULT_AMOUNTS);
  const [isConfigured, setIsConfigured] = useState(true);
  const [loading, setLoading] = useState<number | null>(null);

  // Загружаем допустимые суммы при монтировании
  useEffect(() => {
    apiService
      .getPaymentAmounts()
      .then((data) => {
        setAmounts(data.amounts);
        setIsConfigured(data.isConfigured);
      })
      .catch(() => {
        // Используем дефолтные значения при ошибке
      });
  }, []);

  // Проверяем URL на наличие параметра успешной оплаты
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment');

    if (paymentSuccess === 'success') {
      enqueueSnackbar(t('balance.paymentSuccess'), { variant: 'success' });
      refreshBalance();
      // Очищаем URL параметры
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [enqueueSnackbar, refreshBalance, t]);

  const handleTopUp = useCallback(
    async (amount: number) => {
      if (!isConfigured) {
        enqueueSnackbar(t('balance.paymentNotConfigured'), { variant: 'warning' });
        return;
      }

      setLoading(amount);

      try {
        const payment = await apiService.createPayment(amount);

        if (payment.confirmationUrl) {
          // Редирект на страницу оплаты YooKassa
          window.location.href = payment.confirmationUrl;
        } else {
          enqueueSnackbar(t('balance.paymentError'), { variant: 'error' });
        }
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error ? error.message : t('balance.paymentError'),
          { variant: 'error' }
        );
      } finally {
        setLoading(null);
      }
    },
    [isConfigured, enqueueSnackbar, t]
  );

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
        {amounts.map((amount) => (
          <Grid key={amount} size={{ xs: 6 }}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => handleTopUp(amount)}
              disabled={!isConfigured || loading !== null}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              {loading === amount ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `${amount} ₽`
              )}
            </Button>
          </Grid>
        ))}
      </Grid>

      {!isConfigured && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {t('balance.paymentNotConfigured')}
        </Typography>
      )}
    </Container>
  );
}
