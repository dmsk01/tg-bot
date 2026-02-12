import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useStore } from 'src/store/store';
import { cosmicGradients } from 'src/theme/theme-config';

export function GenerateButton() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const {
    prompt,
    isGenerating,
    models,
    selectedModel,
    createGeneration,
    pollGenerationStatus,
    refreshBalance,
    user,
  } = useStore();

  const selectedModelData = models.find((m) => m.name === selectedModel);
  const cost = selectedModelData?.costPerGeneration || 0;
  const canGenerate = prompt.trim().length > 0 && !isGenerating && (user?.balance || 0) >= cost;

  const handleGenerate = async () => {
    try {
      const generationId = await createGeneration();
      if (generationId) {
        const result = await pollGenerationStatus(generationId);
        await refreshBalance();

        if (result.status === 'COMPLETED') {
          enqueueSnackbar(t('editor.generationComplete'), { variant: 'success' });
        } else if (result.status === 'FAILED') {
          const errorMsg = result.errorMessage || 'Unknown error';
          // eslint-disable-next-line no-alert
          alert(`Generation failed:\n${errorMsg}`);
          enqueueSnackbar(t('errors.generationFailed'), { variant: 'error' });
        }
      }
    } catch (error) {
      const errorMsg = (error as Error).message || 'Unknown error';
      // eslint-disable-next-line no-alert
      alert(`Error:\n${errorMsg}`);
      if (errorMsg.includes('Insufficient')) {
        enqueueSnackbar(t('errors.insufficientBalance'), { variant: 'error' });
      } else {
        enqueueSnackbar(t('errors.generic'), { variant: 'error' });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {t('editor.cost', { cost: cost.toFixed(2) })}
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={handleGenerate}
        disabled={!canGenerate}
        startIcon={
          isGenerating ? (
            <CircularProgress size={20} color="inherit" />
          ) : null
        }
        sx={{
          minWidth: 160,
          color: 'common.white',
          background: cosmicGradients.primary,
          '&:hover': {
            background: cosmicGradients.primaryHover,
          },
          '&.Mui-disabled': {
            color: 'common.white',
          },
        }}
      >
        {isGenerating ? t('editor.generating') : t('editor.generate')}
      </Button>
    </Box>
  );
}
