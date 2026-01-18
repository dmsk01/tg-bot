import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useStore } from 'src/store/store';

import {
  PromptEditor,
  ModelSelector,
  ImageUploader,
  GenerateButton,
  TemplateSelector,
  AspectRatioSelector,
} from 'src/sections/editor';

export function EditorPage() {
  const { t } = useTranslation();
  const currentGeneration = useStore((state) => state.currentGeneration);

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {t('editor.title')}
      </Typography>

      <ModelSelector />
      <TemplateSelector />
      <ImageUploader />
      <AspectRatioSelector />
      <PromptEditor />
      <GenerateButton />

      {currentGeneration?.status === 'COMPLETED' && currentGeneration.generatedImageUrl && (
        <Card sx={{ mt: 3, overflow: 'hidden' }}>
          <Box
            component="img"
            src={currentGeneration.generatedImageUrl}
            alt="Generated"
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </Card>
      )}
    </Container>
  );
}
