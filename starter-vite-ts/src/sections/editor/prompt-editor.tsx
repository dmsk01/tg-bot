import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import { useStore } from 'src/store/store';

export function PromptEditor() {
  const { t } = useTranslation();
  const { prompt, negativePrompt, setPrompt, setNegativePrompt } = useStore();

  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder={t('editor.promptPlaceholder')}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        multiline
        rows={2}
        placeholder={t('editor.negativePromptPlaceholder')}
        value={negativePrompt}
        onChange={(e) => setNegativePrompt(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'action.hover',
          },
        }}
      />
    </Box>
  );
}
