import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { useStore } from 'src/store/store';

export function ModelSelector() {
  const { t } = useTranslation();
  const { models, selectedModel, setSelectedModel, fetchModels, isLoadingModels } = useStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current && (!models || models.length === 0)) {
      hasFetched.current = true;
      fetchModels();
    }
  }, [models, fetchModels]);

  if (isLoadingModels) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          {t('editor.selectModel')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={140} height={60} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!models || models.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {t('editor.noModels')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {t('editor.selectModel')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {models.map((model) => (
          <Card
            key={model.id}
            onClick={() => setSelectedModel(model.name)}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              minWidth: 140,
              transition: 'all 0.2s',
              border: '2px solid',
              borderColor: selectedModel === model.name ? 'primary.main' : 'transparent',
              bgcolor: selectedModel === model.name ? 'primary.lighter' : 'background.paper',
              '&:hover': {
                borderColor: 'primary.light',
              },
            }}
          >
            <Typography variant="subtitle2" noWrap>
              {model.displayName}
            </Typography>
            <Chip
              size="small"
              label={`${model.costPerGeneration} RUB`}
              color={selectedModel === model.name ? 'primary' : 'default'}
              sx={{ mt: 0.5 }}
            />
          </Card>
        ))}
      </Box>
    </Box>
  );
}
