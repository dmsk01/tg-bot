import { useTranslation } from 'react-i18next';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

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
    </Container>
  );
}
