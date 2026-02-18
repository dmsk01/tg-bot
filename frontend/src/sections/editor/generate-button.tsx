import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useStore } from 'src/store/store';
import { cosmicGradients } from 'src/theme/theme-config';

type AlertState = { message: string; severity: 'error' | 'success' | 'warning' | 'info' } | null;

export function GenerateButton() {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<AlertState>(null);
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
    setAlert(null);
    try {
      const generationId = await createGeneration();
      if (generationId) {
        const result = await pollGenerationStatus(generationId);
        await refreshBalance();

        if (result.status === 'COMPLETED') {
          setAlert({ message: t('editor.generationComplete'), severity: 'success' });
        } else if (result.status === 'FAILED') {
          const errorMsg = result.errorMessage || 'Unknown error';
          console.error(`Generation failed: ${errorMsg}`);
          setAlert({ message: t('errors.generationFailed'), severity: 'error' });
        }
      }
    } catch (error) {
      const errorMsg = (error as Error).message || 'Unknown error';
      console.error(`Error: ${errorMsg}`);
      if (errorMsg.includes('Insufficient')) {
        setAlert({ message: t('errors.insufficientBalance'), severity: 'error' });
      } else {
        setAlert({ message: t('errors.generic'), severity: 'error' });
      }
    }
  };

  return (
    <Box>
      {alert && (
        <Alert
          variant="outlined"
          severity={alert.severity}
          onClose={() => setAlert(null)}
          sx={{ mb: 1.5 }}
        >
          {alert.message}
        </Alert>
      )}
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
            color: 'common.white',
          },
          '&:active': {
            color: 'common.white',
          },
          '&.Mui-disabled': {
            color: 'common.white',
          },
        }}
      >
        {isGenerating ? t('editor.generating') : t('editor.generate')}
      </Button>
      </Box>
    </Box>
  );
}
