import type { AspectRatio } from 'src/types';

import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useStore } from 'src/store/store';

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

export function AspectRatioSelector() {
  const { t } = useTranslation();
  const { aspectRatio, setAspectRatio } = useStore();

  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: AspectRatio | null) => {
    if (newValue) {
      setAspectRatio(newValue);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {t('editor.aspectRatio')}
      </Typography>
      <ToggleButtonGroup
        value={aspectRatio}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{
          flexWrap: 'wrap',
          gap: 0.5,
          '& .MuiToggleButton-root': {
            px: 2,
            py: 0.75,
            borderRadius: '8px !important',
            border: 'none',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        {ASPECT_RATIOS.map((ratio) => (
          <ToggleButton key={ratio.value} value={ratio.value}>
            {ratio.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
