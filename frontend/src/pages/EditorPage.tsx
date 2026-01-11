import { useTranslation } from 'react-i18next';
import { ModelSelector } from '@/components/Editor/ModelSelector';
import { TemplateSelector } from '@/components/Editor/TemplateSelector';
import { AspectRatioSelector } from '@/components/Editor/AspectRatioSelector';
import { ImageUploader } from '@/components/Editor/ImageUploader';
import { PromptEditor } from '@/components/Editor/PromptEditor';
import { GenerateButton } from '@/components/Editor/GenerateButton';
import { useStore } from '@/store/store';

export function EditorPage() {
  const { t } = useTranslation();
  const currentGeneration = useStore((state) => state.currentGeneration);

  return (
    <div className="page editor-page">
      <h2 className="page-title">{t('editor.title')}</h2>

      <ModelSelector />
      <TemplateSelector />
      <ImageUploader />
      <AspectRatioSelector />
      <PromptEditor />
      <GenerateButton />

      {currentGeneration?.status === 'COMPLETED' && currentGeneration.generatedImageUrl && (
        <div className="generation-result">
          <img
            src={currentGeneration.generatedImageUrl}
            alt="Generated"
            className="generated-image"
          />
        </div>
      )}
    </div>
  );
}
